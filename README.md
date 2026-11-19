# CampusWell — Institutional Student Wellness Management System

CampusWell is a role-based web platform designed to help educational institutions support student wellbeing through early check-ins, counselling appointments, support requests, campus feedback, and wellness resources.

## Live application

- **Frontend:** https://mansibisht1134-max.github.io/campuswell_group_9/
- **Backend API:** https://campuswell-api-dah4.onrender.com
- **Interactive API documentation:** https://campuswell-api-dah4.onrender.com/docs
- **API health:** https://campuswell-api-dah4.onrender.com/api/v1/health

## User roles

| Role | Main capabilities |
| --- | --- |
| Student | Register/sign in, submit wellness check-ins, book counselling appointments, raise support requests, submit campus feedback, browse resources, manage profile and notifications. |
| Counsellor | Manage appointments, review assigned student wellness records, create interventions and follow-ups, record outcomes, respond to support requests, manage availability and notifications. |
| Administrator | View institution-level analytics, manage counsellor accounts, assign support requests, moderate campus submissions, and manage published resources. |

## Key modules

- **Authentication and access control:** JWT-based login and role-protected API routes.
- **Wellness check-ins:** Students can record mood, sleep, energy, stress, and notes.
- **Appointments:** Counsellor discovery, appointment booking, status updates, and rescheduling.
- **Support requests:** Students can submit requests and counsellors can manage and respond to assigned requests.
- **Campus Voice:** Issue/feedback submissions with moderation workflows and anonymous submission support.
- **Resources:** A curated resource library with administrator publishing controls.
- **Counsellor workspace:** Wellness records and trends, interventions, follow-ups, outcomes, support inbox, and notifications.
- **Admin workspace:** Institution overview and dedicated pages for counsellors, support assignments, Campus Voice moderation, and resources.

## Technology

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python, FastAPI, SQLAlchemy, Pydantic
- **Database:** PostgreSQL in deployment; SQLite can be used for local development
- **Authentication:** JWT access tokens and password hashing
- **Migrations:** Alembic
- **Hosting:** GitHub Pages (frontend) and Render (API)

## Local backend setup

Requirements: Python 3.11+ and a local SQLite database or PostgreSQL instance.

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
alembic upgrade head
uvicorn main:app --reload
```

Open the API at http://127.0.0.1:8000 and the Swagger documentation at http://127.0.0.1:8000/docs.

Configure secrets and database credentials in the backend environment. Never commit a real `.env` file or share passwords, JWT signing keys, bootstrap tokens, or access tokens.

## Project structure

```text
.
├── admin/                 # Admin login and management pages
├── analytics/             # Admin analytics dashboard
├── appointments/          # Student appointment experience
├── backend/               # FastAPI application, models, schemas, migrations, tests
├── campus-voice/          # Student campus feedback and issue reporting
├── counsellor/            # Counsellor workspace
├── dashboard/             # Student dashboard
├── notifications/         # Notification centre
├── resources/              # Student resource library
├── student-login/         # Student authentication
├── wellness/              # Student wellness check-ins
└── index.html             # Application landing page
```

## Important implementation note

The counsellor wellness-insight indicator is a rule-based screening aid based on submitted check-in data. It is **not a trained machine-learning model, clinical diagnosis, or substitute for professional assessment**. Sample trend visualisations are identified as illustrative where applicable.

## Development and verification

- Backend API tests are in `backend/tests/test_api.py`.
- Database schema changes are managed through Alembic migrations.
- The frontend is published from the `main` branch using GitHub Actions.
- The backend is deployed from the `backend-foundation` branch on Render.

## Privacy and security

CampusWell handles sensitive wellbeing information. Use role-based access, restrict access to authorised staff, configure strong deployment secrets, and follow institutional data-protection policies before using real student data. Demo/testing credentials and tokens must not be reused in production.
