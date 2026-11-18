# CampusWell Backend

FastAPI backend foundation for the CampusWell Student Wellness Management System.

## Requirements

- Python 3.11 or newer
- PostgreSQL for deployment (SQLite is the local-development default)

## Run locally (Windows PowerShell)

From the repository root:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn main:app --reload
```

If PowerShell blocks virtual-environment activation, run the commands below instead:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

The API will be available at:

- http://127.0.0.1:8000/
- http://127.0.0.1:8000/health
- http://127.0.0.1:8000/api/v1/health
- http://127.0.0.1:8000/docs

## Environment variables

- `DATABASE_URL`: SQLAlchemy database URL. Defaults to a local SQLite database for development. Use the PostgreSQL connection URL supplied by your hosting provider in deployment.
- `CORS_ORIGINS`: comma-separated list of allowed browser origins. The current GitHub Pages origin and common local development origins are allowed by default.

Never commit a real `.env` file, database password, JWT secret, or other deployment secret.

## Current scope

This commit establishes configuration, database engine/session management, CORS, and API/database health checks. Authentication, data models, migrations, business endpoints, and frontend integration are subsequent implementation steps.
