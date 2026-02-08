# 🔍 AI Alpha Scanner

> Discover early-stage crypto projects before they go mainstream.

## ✨ Features

- **🔎 GitHub Scanner** — Discovers new crypto/web3 repositories automatically
- **📊 DeFiLlama Integration** — Tracks early-stage DeFi protocols
- **🤖 AI Analysis** — Generate insights about project potential
- **📈 Scoring System** — Ranks projects 0-10 by alpha potential
- **⏰ Auto Collection** — Scheduled data updates every 6-12 hours
- **🖥️ Cyber Dashboard** — Beautiful dark-themed interface

## 🏗️ Architecture

```
ai-alpha-scanner/
├── backend/          # FastAPI + SQLite
│   ├── app/
│   │   ├── collectors/   # GitHub, DeFiLlama data collectors
│   │   ├── services/     # Business logic
│   │   ├── analyzers/    # AI prompt generation
│   │   ├── models.py     # SQLAlchemy models
│   │   ├── config.py     # Settings
│   │   ├── scheduler.py  # APScheduler jobs
│   │   └── main.py       # FastAPI app
│   └── requirements.txt
└── frontend/         # Next.js 16 + Tailwind CSS v4
    └── src/
        ├── app/          # Pages (dashboard, projects, scheduler, sources, settings)
        ├── components/   # Reusable UI components
        └── lib/          # API client
```

## 🚀 Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and add your GITHUB_TOKEN

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local

npm run dev
```

Open http://localhost:3000

## 🔑 Environment Variables

### Backend (backend/.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | required |
| `APP_ENV` | development or production | development |
| `DATABASE_URL` | SQLite connection string | sqlite+aiosqlite:///./data/alpha_scanner.db |
| `CORS_ORIGINS` | Comma-separated allowed origins | http://localhost:3000 |
| `GITHUB_COLLECT_INTERVAL_HOURS` | GitHub scan interval | 6 |

### Frontend (frontend/.env.local)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | http://localhost:8000 |

## 🌐 Deploy

### Backend → Railway

1. Connect GitHub repo to Railway
2. Set root directory to `backend/`
3. Add environment variables in Railway dashboard
4. Deploy

### Frontend → Vercel

1. Import repo to Vercel
2. Set root directory to `frontend/`
3. Add `NEXT_PUBLIC_API_URL` pointing to your Railway backend
4. Deploy

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List projects with filters |
| GET | `/api/projects/{slug}` | Project detail |
| GET | `/api/stats` | Database statistics |
| POST | `/api/collect/github` | Run GitHub collection |
| POST | `/api/collect/defillama` | Run DeFiLlama collection |
| POST | `/api/collect/all` | Run all collectors |
| GET | `/api/scheduler/status` | Scheduler status |
| POST | `/api/scheduler/start` | Start scheduler |
| GET | `/api/analysis/prompt/{id}` | Generate AI prompt |
| POST | `/api/analysis/save/{id}` | Save AI analysis |

## 📄 License

MIT
