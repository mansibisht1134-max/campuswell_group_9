# CampusWell — Institutional Student Wellness Management System

CampusWell is a role-based student wellness platform for educational institutions. It brings student wellness check-ins, counselling appointments, support requests, campus feedback, and wellbeing resources into one connected system, with separate workspaces for students, counsellors, and administrators.

The project is designed around early support, organised follow-up, and privacy-aware access to student wellbeing information.

## Live application

| Component | Link |
| --- | --- |
| **Main website** | [Open CampusWell](https://mansibisht1134-max.github.io/campuswell_group_9/) |
| **Backend API** | [CampusWell API](https://campuswell-api-dah4.onrender.com) |
| **Interactive API documentation** | [Swagger UI](https://campuswell-api-dah4.onrender.com/docs) |
| **API health check** | [Health endpoint](https://campuswell-api-dah4.onrender.com/api/v1/health) |
| **Source code** | [GitHub repository](https://github.com/mansibisht1134-max/campuswell_group_9) |

## Quick access — application portals

- [Student Login](https://mansibisht1134-max.github.io/campuswell_group_9/student-login/student-login.html)
- [Counsellor Login](https://mansibisht1134-max.github.io/campuswell_group_9/counsellor-login/counsellor-login.html)
- [Admin Login](https://mansibisht1134-max.github.io/campuswell_group_9/admin/admin.html)
- [Admin Analytics](https://mansibisht1134-max.github.io/campuswell_group_9/analytics/analytics.html)
- [Manage Counsellors](https://mansibisht1134-max.github.io/campuswell_group_9/admin/counsellors.html)
- [Support Requests](https://mansibisht1134-max.github.io/campuswell_group_9/admin/support.html)
- [Campus Voice Moderation](https://mansibisht1134-max.github.io/campuswell_group_9/admin/campus-voice.html)
- [Wellness Resources Management](https://mansibisht1134-max.github.io/campuswell_group_9/admin/resources.html)

> Portal pages may require an authorised account. Do not publish passwords, access tokens, bootstrap tokens, or other secrets in this repository or in project documentation.

## User roles

| Role | Main capabilities |
| --- | --- |
| **Student** | Register/sign in, submit wellness check-ins, book counselling appointments, raise support requests, submit campus feedback, browse resources, manage profile and notifications. |
| **Counsellor** | Manage appointments, review assigned student wellness records, create interventions and follow-ups, record outcomes, respond to support requests, manage availability and notifications. |
| **Administrator** | View institution-level analytics, manage counsellor accounts, assign support requests, moderate campus submissions, and manage published resources. |

## Key features and modules

- **Authentication and role-based access:** JWT-based login and role-protected API routes.
- **Wellness check-ins:** Students can record mood, sleep, energy, stress, and notes.
- **Counselling appointments:** Counsellor discovery, appointment booking, status updates, and rescheduling.
- **Support requests:** Students can submit requests; counsellors can manage and respond to assigned requests.
- **Campus Voice:** Issue and feedback submissions with moderation workflows and anonymous submission support.
- **Wellness resources:** A resource library with administrator publishing controls.
- **Counsellor workspace:** Wellness records and trends, interventions, follow-ups, outcomes, support inbox, and notifications.
- **Admin workspace:** Institution overview and dedicated pages for counsellors, support assignments, Campus Voice moderation, and resources.

## Technology stack

| Layer | Technologies |
| --- | --- |
| Frontend | HTML, CSS, JavaScript |
| Backend | Python, FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL (deployed); SQLite can be used for local development |
| Authentication | JWT access tokens and password hashing |
| Database migrations | Alembic |
| Frontend hosting | GitHub Pages |
| Backend hosting and database | Render |

## System architecture

```text
Student / Counsellor / Admin
            |
            v
     GitHub Pages
   HTML + CSS + JavaScript
            |
        HTTPS API
            |
            v
      Render Web Service
       Python + FastAPI
            |
            v
     Render PostgreSQL
```

The frontend communicates with the backend through HTTP API requests. The backend validates requests, applies role-based access rules, and reads or writes application data in PostgreSQL. The database is not a public website; manage it through the Render Dashboard and keep its connection credentials private.

- [Render Dashboard](https://dashboard.render.com/) — manage the deployed API service and PostgreSQL database.
- [GitHub Actions](https://github.com/mansibisht1134-max/campuswell_group_9/actions) — view frontend deployment and automated workflow runs.

## Local backend setup

Requirements: Python 3.11+ and a local SQLite database or PostgreSQL instance.

```powershell
cd backend
py -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
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

## Implementation and verification notes

- Backend API tests are in `backend/tests/test_api.py`.
- Database schema changes are managed through Alembic migrations.
- The frontend is published from the `main` branch using GitHub Actions.
- The backend is deployed from the `backend-foundation` branch on Render.
- The backend automated test workflow has passed. Complete end-to-end testing of all role-based user journeys before treating the system as production-ready.

The counsellor wellness-insight indicator is a **rule-based screening aid** based on submitted check-in data. It is not a trained machine-learning model, clinical diagnosis, or substitute for professional assessment. Sample trend visualisations are illustrative where applicable.

## Privacy, security, and responsible use

CampusWell handles sensitive wellbeing information. Before using real student data, configure strong unique deployment secrets, rotate any credentials or tokens that may have been exposed, restrict access to authorised staff, validate all user journeys, and follow applicable institutional data-protection policies. Do not use demo/testing credentials in production.
