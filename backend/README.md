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
alembic upgrade head
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
- `JWT_SECRET`: required random signing secret for access tokens.
- `ADMIN_BOOTSTRAP_TOKEN`: one-time high-entropy secret required to create the first administrator. Remove it from the hosting environment after successful bootstrap.

Never commit a real `.env` file, database password, JWT secret, or other deployment secret.

## Current scope

The backend currently includes SQLAlchemy data models, student registration/login with JWT authentication, one-time first-admin bootstrap, admin-managed counsellor accounts and profiles, appointment booking, private wellness check-ins, support requests, Campus Voice submissions, wellness resource management, and role-private in-app notifications.

## Authentication and API routes

### Admin dashboard and analytics

- `GET /api/v1/admin/dashboard/summary` — compact institution-wide dashboard counters (admin only)
- `GET /api/v1/admin/analytics/overview` — aggregate student, counsellor, appointment, support, wellness, intervention, follow-up, resource, and Campus Voice totals; includes status distributions and six-month appointment/check-in trends (admin only)

Analytics return aggregate counts and monthly trends only; private wellness notes and individual student identities are not included.

### Notifications

- `GET /api/v1/notifications` — list the signed-in user's notifications; supports `unread_only`, `limit`, and `offset`
- `GET /api/v1/notifications/unread-count` — return the signed-in user's unread count
- `PATCH /api/v1/notifications/{id}/read` — mark one of the user's notifications as read
- `POST /api/v1/notifications/read-all` — mark all of the user's notifications as read
- `DELETE /api/v1/notifications/{id}` — delete one of the user's notifications

Appointment requests, appointment status changes, support-request assignments, follow-up scheduling, and new interventions create in-app notifications for the relevant account.

- `POST /api/v1/admin/bootstrap` — create the first admin using the deployment-only `ADMIN_BOOTSTRAP_TOKEN` secret; disabled after an admin exists
- `POST /api/v1/admin/counsellors` and `GET /api/v1/admin/counsellors` — admins provision and list counsellor accounts
- `GET /api/v1/counsellors/me` and `PATCH /api/v1/counsellors/me` — counsellors view and update their own profile and availability
- `GET /api/v1/counsellor/students` — list students connected through appointments or assigned support requests
- `GET/POST /api/v1/counsellor/follow-ups` and `PATCH /api/v1/counsellor/follow-ups/{id}` — manage follow-up schedules
- `GET/POST /api/v1/counsellor/interventions` and `PATCH /api/v1/counsellor/interventions/{id}` — manage student interventions
- `GET/POST /api/v1/counsellor/outcomes` and `PATCH /api/v1/counsellor/outcomes/{id}` — record and update intervention outcomes
- `POST /api/v1/auth/register/student` — create a student account
- `POST /api/v1/auth/login` — obtain a bearer token
- `GET /api/v1/auth/me` — read the signed-in account
- `GET /api/v1/counsellors` — list available counsellors
- `POST /api/v1/appointments` and `GET /api/v1/appointments` — book and list appointments
- `PATCH /api/v1/appointments/{id}/status` — update an appointment status with role/ownership checks
- `POST /api/v1/wellness/checkins` — submit a student wellness check-in
- `GET /api/v1/wellness/checkins` — retrieve the signed-in student's check-in history
- `GET /api/v1/wellness/students/{student_id}/checkins` — counsellor access for students linked through their appointments
- `POST /api/v1/support/requests` and `GET /api/v1/support/requests` — submit and retrieve role-scoped support requests
- `PATCH /api/v1/support/requests/{id}` — admins assign requests; assigned counsellors update workflow status
- `POST /api/v1/campus-voice` — submit anonymous feedback, complaints, or suggestions; authenticated students may also submit non-anonymously
- `GET /api/v1/campus-voice` and `PATCH /api/v1/campus-voice/{id}/status` — counsellor/admin review and status management
- `GET /api/v1/resources` — browse published wellness resources with optional category filtering
- `POST /api/v1/resources` and `PATCH /api/v1/resources/{id}` — admin resource publishing and editing
- `POST /api/v1/resources/{id}/save`, `GET /api/v1/resources/saved`, and `DELETE /api/v1/resources/{id}/save` — student saved-resource management

Set `JWT_SECRET` to a unique, randomly generated secret of at least 32 characters in your local `.env` and hosting environment. Do not use the example placeholder in a deployed environment. `ACCESS_TOKEN_MINUTES` defaults to 60.

Wellness records are private: students can access their own history, and counsellors can access only students linked to their appointments. Admin-wide wellness access is intentionally not provided by these routes.

This is still an implementation in progress. Add and run automated tests, introduce Alembic migrations, configure production PostgreSQL and secrets, and complete frontend integration before production deployment.


## Synthetic demo database

The repository includes `seed_demo_data.py`, which creates fictional sample records for dashboard and workflow demonstrations. It creates one admin, two counsellors, eight students, appointments, wellness check-ins, support requests, Campus Voice entries, resources, interventions, follow-ups, outcomes, and notifications.

Run it from the `backend` directory against a development database:

```powershell
$env:ALLOW_DEMO_SEED="true"
python seed_demo_data.py
```

The script is opt-in, refuses to run without `ALLOW_DEMO_SEED=true`, and stops if the database URL contains `prod`. It does not overwrite an existing demo dataset. All sample people and records are fictional.

Demo login accounts (all use the same demo-only password):

- Admin: `admin@campuswell.demo`
- Counsellors: `counsellor1@campuswell.demo`, `counsellor2@campuswell.demo`
- Students: `student1@campuswell.demo` through `student8@campuswell.demo`
- Password: `CampusWellDemo!2026`

Never deploy these demo credentials or synthetic records to a live institution. Use a fresh database and real, authorized account provisioning for production.


## Database migrations

Alembic is configured for versioned schema migrations. The initial schema migration is already included. For a fresh database, apply it with:

```powershell
cd backend
alembic upgrade head
```

For future model changes, generate a new revision with `alembic revision --autogenerate -m "describe schema change"`, review the generated migration, and apply it with `alembic upgrade head`. Do not edit an already-applied migration; create a new revision instead.

## Automated backend tests

Run from the backend directory:

```powershell
pytest -q
```

The GitHub Actions workflow runs these backend smoke tests when code is pushed to this branch or a pull request targets it. These tests are an initial safety net, not a substitute for full integration, authorization, and database tests.

## Cloud deployment preparation (Render)

The repository root contains a Render Blueprint at `render.yaml`. It defines the CampusWell FastAPI web service and deploys from the `backend-foundation` branch. It does not create a paid database automatically.

To deploy:

1. Create or sign in to a Render account and connect the GitHub repository.
2. In Render, choose **New → Blueprint** and select this repository and the `backend-foundation` branch.
3. Review the Blueprint and create the web service.
4. When prompted, provide `DATABASE_URL` from a PostgreSQL database you control. Use the provider's PostgreSQL connection string; keep it private.
5. Provide a new, high-entropy `ADMIN_BOOTSTRAP_TOKEN` in Render's environment settings. Render generates `JWT_SECRET` automatically.
6. After deployment, open the service's `/api/v1/health` endpoint. It should report both the API and database as healthy.

The initial Alembic migration is committed at `migrations/versions/0001_initial_schema.py`. Render runs `alembic upgrade head` before starting the API. Local development should also run `alembic upgrade head` once before starting the server. The API no longer creates tables automatically at startup; schema changes are managed through reviewed migrations.

Do not add real student information or use the synthetic demo accounts in a public deployment. Do not paste database passwords or secret values into GitHub files or chat; enter them only in the hosting provider's private environment settings. A hosted service/database is not created merely by committing this Blueprint.
