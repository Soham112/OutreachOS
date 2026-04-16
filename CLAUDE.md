# OutreachOS — Project Context for Claude

This file gives Claude Code full context about the OutreachOS codebase: what everything does, where to make changes, and what patterns are in use.

---

## What This App Does

OutreachOS automates personalized job outreach for **Soham Patil**. The user uploads a recipient's LinkedIn PDF, optionally attaches a Job Description, and the app generates 6 types of tailored outreach messages using the Claude API. Generated messages can be saved to a SQLite history log with status tracking.

**Live URLs**
- Frontend: `https://outreach-os-lyart.vercel.app`
- Backend: Railway (service name: `outreach-os`, project: `prolific-serenity`)

---

## Architecture

```
Browser (Next.js on Vercel)
        │
        │ HTTP (axios)
        ▼
FastAPI Backend (Railway, port $PORT)
        │
        ├── pdfplumber     → extracts text from uploaded PDFs
        ├── Claude API     → generates outreach messages
        └── SQLite         → stores message history
```

Profile data flows through `sessionStorage` between the Upload page and Generate page — there is no user auth or database for profiles, only for saved messages.

---

## Backend — File by File

### `backend/main.py`
Entry point. Mounts three routers and adds CORS middleware (currently `allow_origins=["*"]` — tighten if adding auth). `load_dotenv()` runs here to load `ANTHROPIC_API_KEY`.

### `backend/routers/analyze.py`
**Endpoint:** `POST /analyze/profile`

Accepts `multipart/form-data` with:
- `linkedin_pdf` (required File)
- `jd_pdf` (optional File)
- `jd_text` (optional Form string)

Calls `pdf_parser.extract_text_from_pdf()` then `parse_linkedin_profile()`, then `detect_recipient_type()`. Returns the structured profile dict + `jd_text` + `recipient_type`.

**To change what profile fields are extracted:** edit `backend/utils/pdf_parser.py → parse_linkedin_profile()`.

### `backend/routers/generate.py`
**Endpoint:** `POST /generate/message`

Accepts JSON body with `recipient_profile`, `recipient_type`, `message_type`, `jd_text`. Calls `claude_client.generate_message()` and returns the result.

**To add a new message type:** add it to the `MessageType` Literal union here AND add an entry to `MESSAGE_TYPE_INSTRUCTIONS` in `claude_client.py`.

### `backend/routers/history.py`
**Endpoints:** `POST /history/save`, `GET /history/list`, `GET /history/{id}`, `PATCH /history/{id}/status`, `DELETE /history/{id}`

SQLite via stdlib `sqlite3`. DB path: `backend/data/history.db`. The `data/` directory is created at module load time via `os.makedirs(..., exist_ok=True)` — this is critical for Railway where empty dirs don't persist.

**SQLite schema (`outreach_history` table):**
```
id             INTEGER PRIMARY KEY AUTOINCREMENT
created_at     TEXT  (ISO datetime)
recipient_name TEXT
company        TEXT
recipient_type TEXT  ("RECRUITER" | "HIRING_MANAGER")
message_type   TEXT  (see message types below)
subject        TEXT  (empty string for message-only types)
message_body   TEXT
status         TEXT  ("Draft" | "Sent" | "Replied" | "No Response")
```

**To add a new column:** add it to the `CREATE TABLE` statement and add a migration (or drop and recreate the DB locally). On Railway, the DB resets on each redeploy anyway unless a Volume is attached.

### `backend/utils/pdf_parser.py`
Two functions:
- `extract_text_from_pdf(bytes) → str` — uses pdfplumber, reads all pages
- `parse_linkedin_profile(text) → dict` — regex-based parser

LinkedIn PDF layout assumptions:
- Line 0 = name
- Lines 1-5 — looks for "X at Y" pattern for role + company
- Falls back to line 1 as the headline/role
- Scans for "Skills" section header, collects bullet/comma items
- Scans for "Experience" section, takes first 15 lines

`raw_text` is capped at 3000 chars (this is what gets sent to Claude as the recipient profile context).

**If LinkedIn PDF parsing breaks** (LinkedIn changes their PDF format): this is the file to edit. The regex patterns are the fragile part.

### `backend/utils/claude_client.py`
All Claude API logic lives here. Key parts:

**`SOHAM_PROFILE`** — hardcoded string with Soham's full profile. This is injected into every system prompt. **Update this when Soham's experience or details change.**

**`SYSTEM_PROMPT`** — always prepended to every Claude call. Contains the writing rules (no buzzwords, warm tone, recruiter vs hiring manager differentiation, etc.).

**`MESSAGE_TYPE_INSTRUCTIONS`** — dict keyed by message type string. Each value is the specific instruction appended to the user prompt for that message type. This controls length limits, format, and tone per type.

**`generate_message()`** — builds user prompt, calls `client.messages.create()` with `claude-sonnet-4-20250514`, parses the response. Returns:
- `{"message": str}` for `connection_request` and `followup`
- `{"subject": str, "body": str, "raw": str}` for `inmail`, `cold_email_*`

The subject/body split is done by looking for lines starting with `SUBJECT:` and `BODY:` (case-insensitive).

**To change the Claude model:** update the `model=` argument in `generate_message()`.
**To change writing rules:** edit `SYSTEM_PROMPT`.
**To change message length/format:** edit the relevant entry in `MESSAGE_TYPE_INSTRUCTIONS`.

### `backend/utils/profile_detector.py`
Simple keyword matcher. Checks `current_role.lower()` against two lists:
- `RECRUITER_KEYWORDS`: recruiter, talent, acquisition, sourcer, staffing, hr, etc.
- `HIRING_MANAGER_KEYWORDS`: manager, director, lead, head, vp, engineer, scientist, etc.

Recruiter check runs first. Falls back to `HIRING_MANAGER` if no match.

**To add keywords:** append to either list.

---

## Message Types

| Key | Tab | Format returned | Notes |
|---|---|---|---|
| `connection_request` | Connection Request | `{message}` | 300 char hard limit |
| `followup` | Follow-up | `{message}` | 500-800 chars |
| `inmail` | InMail | `{subject, body}` | 150-300 words |
| `cold_email_short` | Cold Email → Short | `{subject, body}` | <100 words |
| `cold_email_detailed` | Cold Email → Detailed | `{subject, body}` | <200 words, includes portfolio link |
| `cold_email_followup` | Cold Email → Follow-up | `{subject, body}` | <50 words |

---

## Frontend — File by File

### `frontend/lib/api.ts`
All HTTP calls go through here via axios. `API_URL` reads from `process.env.NEXT_PUBLIC_API_URL` (falls back to `http://localhost:8000`).

**All TypeScript interfaces are defined here** — `ProfileData`, `GenerateRequest`, `GenerateResult`, `HistoryEntry`, etc. If the backend response shape changes, update these interfaces first.

**Important:** `NEXT_PUBLIC_API_URL` is baked in at build time. Changing it in Vercel requires a full Redeploy, not just a restart.

### `frontend/app/page.tsx` — Upload & Analyze Screen
- State: `linkedinFile`, `jdFile`, `jdText`, `profile` (ProfileData | null), `loading`, `error`
- Calls `analyzeProfile()` from `api.ts`
- On success: renders `<ProfileCard>` and a "Generate Outreach →" button
- On click: writes profile to `sessionStorage` under key `"outreach_profile"` and navigates to `/generate`

**Profile is passed between pages via `sessionStorage`** — not a URL param, not a global store. If you add more pages that need the profile, read from `sessionStorage.getItem("outreach_profile")`.

### `frontend/app/generate/page.tsx` — Generate Screen
- Reads profile from `sessionStorage` on mount; redirects to `/` if missing
- Renders `<ProfileCard>` (left column) and `<MessageTabs>` (right column) in a two-column grid on large screens

### `frontend/app/history/page.tsx` — History Screen
- Calls `listHistory()` on mount and on manual refresh
- Shows 4 stats cards (Total, Draft, Sent, Replied) when entries exist
- Renders `<HistoryTable>` which handles expand/collapse, status updates, and deletes

### `frontend/components/UploadZone.tsx`
Uses `react-dropzone`. Accepts only `.pdf` files. Shows green checkmark + filename on upload. `onFile` callback fires with the `File` object.

### `frontend/components/ProfileCard.tsx`
Displays extracted profile. Badge color: purple = RECRUITER, blue = HIRING_MANAGER. Shows green JD indicator banner when `profile.jd_text` is non-empty. Caps skills display at 16 tags.

### `frontend/components/MessageTabs.tsx`
Most complex component. Key design decisions:
- Tab state (`activeTab`) and cold email subtype (`coldSubtype`) are local state
- Generated results are cached in `results: Record<string, GenerateResult>` keyed by message type string — switching tabs doesn't re-fetch
- `currentKey` = `coldSubtype` when on the cold_email tab, otherwise `activeTab`
- `MessageBox` is a sub-component that handles both the subject+body layout (for emails/InMail) and the plain message layout (for connection/followup)
- Character counter only shown for `connection_request` (300 char limit)
- "Regenerate" link appears below a result to re-call the API for that type

**To add a new tab:** add to `TABS` array, add to `MESSAGE_TYPE_INSTRUCTIONS` in `claude_client.py`, add to the `MessageType` Literal in `routers/generate.py` and `lib/api.ts`.

### `frontend/components/HistoryTable.tsx`
- Click any row to expand and view the full message
- Status dropdown is a `<select>` that calls `updateStatus()` inline
- Delete button calls `deleteEntry()` after a `window.confirm`
- `MESSAGE_TYPE_LABELS` maps API keys to human-readable display names — update this if adding new message types

### `frontend/components/CopyButton.tsx`
Two modes: `small` (inline text link) and default (button with border). Uses `navigator.clipboard.writeText()` with a textarea fallback. Shows "Copied!" for 2 seconds.

### `frontend/components/NavBar.tsx`
Three nav links. Active state detected via `usePathname()`. No mobile hamburger menu — links shrink on small screens.

---

## Design System

| Token | Value | Usage |
|---|---|---|
| Primary | `#1B3A6B` | Buttons, active tabs, links, badges |
| Secondary | `#8FAF8F` | Success states, JD indicator, sage accents |
| Background | `#FFFFFF` | Page background |
| Surface | `#F8FAFC` | Card backgrounds, tab headers |
| Border | `#E2E8F0` | All card/input borders |
| Text | `#0F172A` | Headings and primary text |
| Muted | `#64748B` | Secondary text, labels |
| Font | Inter | Loaded via Google Fonts in `layout.tsx` |

CSS utility classes defined in `globals.css`: `.btn-primary`, `.btn-secondary`, `.card`, `.badge-recruiter`, `.badge-hiring-manager`, `.tag`.

---

## Data Flow (End to End)

```
1. User drops LinkedIn PDF on UploadZone
2. page.tsx → analyzeProfile() → POST /analyze/profile (multipart)
3. Backend: pdfplumber extracts text → parse_linkedin_profile() → detect_recipient_type()
4. ProfileData returned → stored in sessionStorage["outreach_profile"]
5. User clicks "Generate Outreach" → router.push("/generate")
6. generate/page.tsx reads sessionStorage → renders MessageTabs
7. User picks tab → clicks Generate → generateMessage() → POST /generate/message (JSON)
8. Backend: claude_client.generate_message() → Claude API → parse response
9. Result displayed in MessageBox → user clicks "Save to History"
10. saveHistory() → POST /history/save → SQLite INSERT
11. history/page.tsx → listHistory() → GET /history/list → renders table
```

---

## Environment Variables

| Variable | Where | Value in prod |
|---|---|---|
| `ANTHROPIC_API_KEY` | Railway env var | Real key from console.anthropic.com |
| `NEXT_PUBLIC_API_URL` | Vercel env var | `https://outreach-os-xxxx.up.railway.app` |

**`NEXT_PUBLIC_API_URL` is a build-time variable** — after changing it in Vercel, trigger a Redeploy or it won't take effect.

**Never put secrets in `backend/.env.example`** — that file is committed to git.

---

## Common Change Locations

| What you want to change | File(s) to edit |
|---|---|
| Soham's profile / bio | `backend/utils/claude_client.py` → `SOHAM_PROFILE` |
| Writing rules / tone | `backend/utils/claude_client.py` → `SYSTEM_PROMPT` |
| Message length limits or format | `backend/utils/claude_client.py` → `MESSAGE_TYPE_INSTRUCTIONS[key]` |
| Add a new message type | `claude_client.py` + `routers/generate.py` (Literal) + `lib/api.ts` (type) + `MessageTabs.tsx` (TABS array) + `HistoryTable.tsx` (labels) |
| Fix LinkedIn PDF parsing | `backend/utils/pdf_parser.py` → `parse_linkedin_profile()` |
| Add/remove recruiter keywords | `backend/utils/profile_detector.py` |
| Add a column to history | `backend/routers/history.py` → schema + INSERT + SELECT |
| Change colors / design tokens | `frontend/app/globals.css` + inline Tailwind classes |
| Add a new page | `frontend/app/<name>/page.tsx` + add link to `NavBar.tsx` |
| Change Claude model | `backend/utils/claude_client.py` → `model=` in `generate_message()` |
| Change API base URL | `frontend/lib/api.ts` → `API_URL` (or set `NEXT_PUBLIC_API_URL` env var) |

---

## Deployment Notes

- **Railway**: start command is `uvicorn main:app --host 0.0.0.0 --port $PORT`. Root directory is `backend/`. SQLite DB resets on each deploy unless a Railway Volume is mounted at `/app/data`.
- **Vercel**: root directory is `frontend/`. Build command is `npm run build`. `vercel.json` is present in `frontend/`.
- **Git**: `venv/`, `node_modules/`, `.next/`, `backend/.env`, `frontend/.env.local`, and `backend/data/history.db` are all gitignored.

---

## Known Limitations / Future Work

- SQLite history is ephemeral on Railway (resets on redeploy). Swap for Railway Postgres to persist.
- LinkedIn PDF parsing is regex-based and can break if LinkedIn changes their PDF layout. A more robust approach would send the raw text to Claude for structured extraction.
- CORS is open (`allow_origins=["*"]`). Lock down to Vercel domain when stable.
- No authentication — anyone with the Railway URL can hit the API.
- Profile is passed via `sessionStorage`, so navigating directly to `/generate` without going through `/` first will redirect back to `/`.
