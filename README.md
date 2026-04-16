# OutreachOS

AI-powered personalized job outreach automation built for Soham Patil.

**Live:** [outreach-os-lyart.vercel.app](https://outreach-os-lyart.vercel.app)

## Tech Stack

- **Frontend**: Next.js 14 + Tailwind CSS → Vercel
- **Backend**: FastAPI + Python → Railway
- **LLM**: Anthropic Claude (`claude-sonnet-4-20250514`)
- **PDF Parsing**: pdfplumber
- **Database**: SQLite (auto-created at runtime)

---

## Features

- **Upload & Analyze**: Drag-and-drop LinkedIn profile PDF + optional Job Description (PDF or pasted text)
- **Smart Detection**: Auto-detects Recruiter vs. Hiring Manager from title keywords
- **6 Message Types**: Connection request, follow-up, InMail, and 3 cold email variants (short / detailed / follow-up)
- **Live Character Counter**: 300-character hard limit enforced for LinkedIn connection requests
- **One-click Copy**: Copy any message or subject+body together
- **History Log**: SQLite-backed table with status tracking (Draft → Sent → Replied → No Response)

---

## Project Structure

```
OutreachOS/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env.example             # Template — never put real keys here
│   ├── routers/
│   │   ├── analyze.py           # PDF upload + profile extraction
│   │   ├── generate.py          # Claude API message generation
│   │   └── history.py           # SQLite CRUD for history log
│   ├── utils/
│   │   ├── pdf_parser.py        # pdfplumber text extraction
│   │   ├── claude_client.py     # Anthropic SDK wrapper + system prompts
│   │   └── profile_detector.py  # Recruiter vs. Hiring Manager detection
│   └── data/
│       └── history.db           # SQLite database (auto-created at startup)
└── frontend/
    ├── app/
    │   ├── page.tsx             # Screen 1: Upload & Analyze
    │   ├── generate/page.tsx    # Screen 2: Generate Outreach
    │   └── history/page.tsx     # Screen 3: History Log
    ├── components/
    │   ├── NavBar.tsx
    │   ├── UploadZone.tsx
    │   ├── ProfileCard.tsx
    │   ├── MessageTabs.tsx
    │   ├── CopyButton.tsx
    │   └── HistoryTable.tsx
    ├── lib/
    │   └── api.ts               # Axios API client
    └── vercel.json              # Vercel build config
```

---

## Local Setup

### 1. Clone

```bash
git clone https://github.com/Soham112/OutreachOS.git
cd OutreachOS
```

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create your `.env` file (never edit `.env.example` with real keys — it is committed to git):

```bash
cp .env.example .env
# Open .env and set your ANTHROPIC_API_KEY
```

Start the backend:

```bash
uvicorn main:app --reload --port 8000
```

API runs at `http://localhost:8000` · Interactive docs at `http://localhost:8000/docs`

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000 in .env.local
npm install
npm run dev
```

App runs at `http://localhost:3000`

---

## Environment Variables

### Backend — `backend/.env` (gitignored, never committed)

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key from console.anthropic.com |

### Frontend — `frontend/.env.local` (gitignored, never committed)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL — `http://localhost:8000` locally, Railway URL in production |

> **Important**: `NEXT_PUBLIC_*` variables are baked into the Next.js build at compile time. After changing this value in Vercel you must trigger a **Redeploy** for it to take effect.

---

## How to Use

1. **Upload** — Drop a LinkedIn profile PDF (LinkedIn → More → Save to PDF). Optionally attach a Job Description PDF or paste JD text.
2. **Analyze** — Click "Analyze Profile" to extract name, role, company, skills, and auto-detect Recruiter vs. Hiring Manager.
3. **Generate** — Click "Generate Outreach". Pick a tab and click Generate — Claude writes a tailored message.
4. **Copy & Save** — Copy the message with one click. Save it to history to track its status.
5. **Track** — Visit the History page to update status (Draft → Sent → Replied) and view past messages.

---

## Deployment

### Frontend → Vercel

1. Import `Soham112/OutreachOS` at [vercel.com/new](https://vercel.com/new)
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://your-service.up.railway.app`
4. Deploy
5. After any env var change, go to **Deployments → Redeploy** to rebuild

### Backend → Railway

1. Create new project at [railway.app](https://railway.app) → Deploy from GitHub → `Soham112/OutreachOS`
2. Set **Root Directory** to `backend`
3. Go to **Settings → Networking → Generate Domain** to get a public URL
4. Add environment variable:
   - `ANTHROPIC_API_KEY` = your key from console.anthropic.com
5. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Deploy — Railway installs from `requirements.txt` automatically

Verify the backend is reachable by visiting `https://your-service.up.railway.app/health` — should return `{"status":"ok"}`.

> **SQLite on Railway**: The `data/` directory is created automatically at startup. Note that SQLite resets on every redeploy since Railway's filesystem is ephemeral. Add a Railway Volume mounted at `/app/data` to persist history across deploys.

---

## Security

- **Never** put real API keys in `.env.example` — that file is committed to git
- Real secrets go in `backend/.env` (gitignored) locally, or as Railway environment variables in production
- The `.gitignore` excludes: `backend/venv/`, `backend/.env`, `backend/data/history.db`, `frontend/node_modules/`, `frontend/.next/`, `frontend/.env.local`

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/analyze/profile` | Upload LinkedIn PDF, extract profile |
| `POST` | `/generate/message` | Generate outreach message via Claude |
| `POST` | `/history/save` | Save message to history |
| `GET` | `/history/list` | List all history entries |
| `GET` | `/history/{id}` | Get single entry |
| `PATCH` | `/history/{id}/status` | Update entry status |
| `DELETE` | `/history/{id}` | Delete entry |
| `GET` | `/health` | Health check |

Full interactive docs at `http://localhost:8000/docs` when running locally.
