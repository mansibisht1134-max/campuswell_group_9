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

The backend currently includes SQLAlchemy data models, student registration/login with JWT authentication, appointment booking and status management, and private wellness check-ins.

## Authentication and API routes

- `POST /api/v1/auth/register/student` — create a student account
- `POST /api/v1/auth/login` — obtain a bearer token
- `GET /api/v1/auth/me` — read the signed-in account
- `GET /api/v1/counsellors` — list available counsellors
- `POST /api/v1/appointments` and `GET /api/v1/appointments` — book and list appointments
- `PATCH /api/v1/appointments/{id}/status` — update an appointment status with role/ownership checks
- `POST /api/v1/wellness/checkins` — submit a student wellness check-in
- `GET /api/v1/wellness/checkins` — retrieve the signed-in student's check-in history
- `GET /api/v1/wellness/students/{student_id}/checkins` — counsellor access for students linked through their appointments

Set `JWT_SECRET` to a unique, randomly generated secret of at least 32 characters in your local `.env` and hosting environment. Do not use the example placeholder in a deployed environment. `ACCESS_TOKEN_MINUTES` defaults to 60.

Wellness records are private: students can access their own history, and counsellors can access only students linked to their appointments. Admin-wide wellness access is intentionally not provided by these routes.

This is still an implementation in progress. Add and run automated tests, introduce Alembic migrations, configure production PostgreSQL and secrets, and complete frontend integration before production deployment.
