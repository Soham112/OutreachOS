# OutreachOS

AI-powered personalized job outreach automation built for Soham Patil.

## Tech Stack

- **Frontend**: Next.js 14 + Tailwind CSS (deployed on Vercel)
- **Backend**: FastAPI + Python (deployed on Railway)
- **LLM**: Anthropic Claude (`claude-sonnet-4-20250514`)
- **PDF Parsing**: pdfplumber
- **Database**: SQLite (local history log)

---

## Features

- **Upload & Analyze**: Drag-and-drop LinkedIn profile PDF + optional Job Description
- **Smart Detection**: Auto-detects Recruiter vs. Hiring Manager from title keywords
- **6 Message Types**: Connection request, follow-up, InMail, and 3 cold email variants
- **Live Character Counter**: 300-character enforcement for LinkedIn connection requests
- **History Log**: SQLite-backed table with status tracking (Draft → Sent → Replied)

---

## Project Structure

```
OutreachOS/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt
│   ├── venv/                    # Python virtual environment
│   ├── routers/
│   │   ├── analyze.py           # PDF parsing + profile extraction
│   │   ├── generate.py          # Claude API message generation
│   │   └── history.py           # SQLite CRUD for history log
│   ├── utils/
│   │   ├── pdf_parser.py        # pdfplumber extraction
│   │   ├── claude_client.py     # Anthropic SDK wrapper + prompts
│   │   └── profile_detector.py  # Recruiter vs. Hiring Manager detection
│   └── data/
│       └── history.db           # SQLite database (auto-created)
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
    └── lib/
        └── api.ts               # Axios API client
```

---

## Local Setup

### 1. Clone and navigate

```bash
cd "OutreachOS"
```

### 2. Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create your `.env` file:

```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

Start the backend:

```bash
uvicorn main:app --reload --port 8000
```

The API will be at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

### 3. Frontend setup

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

The app will be at `http://localhost:3000`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL (default: `http://localhost:8000`) |

---

## How to Use

1. **Upload** — Go to the Upload & Analyze screen. Drop a LinkedIn profile PDF (download via LinkedIn → More → Save to PDF). Optionally attach a Job Description PDF or paste JD text.
2. **Analyze** — Click "Analyze Profile" to extract name, role, company, skills, and auto-detect Recruiter vs. Hiring Manager.
3. **Generate** — Click "Generate Outreach" to go to the generation screen. Pick a tab (Connection Request / Follow-up / InMail / Cold Email) and click Generate.
4. **Copy & Save** — Copy the message with one click. Save it to history to track its status.
5. **Track** — Visit the History page to see all saved messages and update their status (Draft → Sent → Replied).

---

## Deployment

### Frontend → Vercel

1. Push the `frontend/` folder to a GitHub repo (or the whole monorepo)
2. Import into [vercel.com](https://vercel.com), set root directory to `frontend`
3. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-railway-backend.up.railway.app`
4. Deploy

### Backend → Railway

1. Push `backend/` to GitHub
2. Create new project on [railway.app](https://railway.app), connect repo
3. Set root directory to `backend/`
4. Add environment variable: `ANTHROPIC_API_KEY=sk-ant-...`
5. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Deploy — Railway will install from `requirements.txt` automatically

> **Note**: For Railway, SQLite persists only within the container. For production, swap SQLite for PostgreSQL using Railway's managed Postgres addon and update `history.py` to use `asyncpg` or `databases`.

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

Full interactive docs available at `http://localhost:8000/docs` when running locally.
