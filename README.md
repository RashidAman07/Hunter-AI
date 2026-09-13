# Hunter AI — Full-Stack Job & Career Platform

Hunter AI is a portfolio-ready full-stack job discovery and career management platform.

## Current MVP features
- Responsive job search dashboard
- Search and filters
- Job details
- Save jobs
- Apply to jobs
- Application tracking
- Recruiter job posting API
- FastAPI REST backend
- SQLite development database
- PostgreSQL-ready configuration
- Resume scoring endpoint using transparent rule-based analysis
- API documentation via FastAPI

## Tech stack
Frontend: React + Vite + JavaScript + CSS
Backend: Python + FastAPI + SQLAlchemy
Database: SQLite for local development; PostgreSQL-ready
Tools: Git, GitHub, Postman

## Run locally

### Backend
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend: http://127.0.0.1:8000
API docs: http://127.0.0.1:8000/docs

### Frontend
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## Environment
Copy `backend/.env.example` to `backend/.env` if you want to configure PostgreSQL.

The project defaults to SQLite so a beginner can run it without installing PostgreSQL first.

## Important
The resume analyzer in this MVP is a transparent scoring engine, not a generative AI model. An AI provider can be added later as a separate service without changing the core application.

## Suggested next upgrades
- JWT authentication
- PostgreSQL production database
- Real resume PDF parsing
- LLM-powered resume feedback
- Recruiter dashboard UI
- Docker + CI/CD
- Cloud deployment
