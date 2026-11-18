"""
Create a clearly synthetic CampusWell demo dataset.

Run from the backend directory only after installing requirements:
    $env:ALLOW_DEMO_SEED="true"
    python seed_demo_data.py

This script is intentionally opt-in and refuses to run unless ALLOW_DEMO_SEED=true.
All people, contact details, messages, and records created here are fictional.
Do not use the demo password or this dataset in production.
"""
import os
import random
from datetime import datetime, timedelta, timezone, date

from database import Base, SessionLocal, engine
from auth import hash_password
from models import (
    Appointment,
    CampusVoiceSubmission,
    CounsellorProfile,
    FollowUp,
    Intervention,
    Notification,
    OutcomeRecord,
    Resource,
    SavedResource,
    StudentProfile,
    SupportRequest,
    User,
    WellnessCheckin,
)

DEMO_PASSWORD = "CampusWellDemo!2026"
random.seed(42)


def main():
    if os.getenv("ALLOW_DEMO_SEED", "").lower() != "true":
        raise SystemExit(
            "Safety stop: set ALLOW_DEMO_SEED=true to confirm this is a demo database."
        )

    database_url = os.getenv("DATABASE_URL", "sqlite:///./campuswell.db")
    if "prod" in database_url.lower():
        raise SystemExit("Safety stop: demo data cannot be seeded into a production database.")

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "admin@campuswell.demo").first()
        if existing:
            print("Demo dataset already exists. No records were changed.")
            return

        now = datetime.now(timezone.utc)
        admin = User(
            email="admin@campuswell.demo",
            password_hash=hash_password(DEMO_PASSWORD),
            role="admin",
            is_active=True,
        )
        db.add(admin)
        db.flush()

        counsellor_specs = [
            ("Aarav Mehta", "counsellor1@campuswell.demo", "CW-C001", "Academic stress", "M.A. Psychology"),
            ("Riya Sharma", "counsellor2@campuswell.demo", "CW-C002", "Emotional wellbeing", "M.Sc. Counselling Psychology"),
        ]
        counsellors = []
        for name, email, employee_id, specialization, qualification in counsellor_specs:
            user = User(email=email, password_hash=hash_password(DEMO_PASSWORD), role="counsellor", is_active=True)
            db.add(user)
            db.flush()
            profile = CounsellorProfile(
                user_id=user.id,
                full_name=name,
                employee_id=employee_id,
                specialization=specialization,
                qualification=qualification,
                phone="9000000001" if employee_id.endswith("1") else "9000000002",
                is_available=True,
            )
            db.add(profile)
            db.flush()
            counsellors.append((user, profile))

        student_names = [
            "Aanya Kapoor", "Vivaan Singh", "Anaya Verma", "Aditya Nair",
            "Ishita Gupta", "Reyansh Patel", "Saanvi Joshi", "Arjun Malhotra",
        ]
        students = []
        for index, name in enumerate(student_names, start=1):
            user = User(
                email=f"student{index}@campuswell.demo",
                password_hash=hash_password(DEMO_PASSWORD),
                role="student",
                is_active=True,
            )
            db.add(user)
            db.flush()
            profile = StudentProfile(
                user_id=user.id,
                full_name=name,
                student_number=f"DEMO2026{index:03d}",
                department=random.choice(["Computer Science", "Business", "Design", "Engineering"]),
                course=random.choice(["B.Tech", "BBA", "B.Des"]),
                year_of_study=random.randint(1, 4),
                phone=f"91000000{index:02d}",
            )
            db.add(profile)
            db.flush()
            students.append((user, profile))

        statuses = ["Pending", "Confirmed", "Completed", "Cancelled"]
        appointments = []
        for index in range(10):
            student_user, student = students[index % len(students)]
            counsellor_user, counsellor = counsellors[index % len(counsellors)]
            appointment = Appointment(
                student_id=student.id,
                counsellor_id=counsellor.id,
                scheduled_at=now + timedelta(days=index - 3),
                duration_minutes=50,
                mode="Online" if index % 2 else "In-person",
                reason=random.choice(["Academic pressure", "Stress management", "Personal wellbeing", "Time management"]),
                message="Synthetic demo appointment request.",
                status=statuses[index % len(statuses)],
            )
            db.add(appointment)
            db.flush()
            appointments.append(appointment)

        for index, (_, student) in enumerate(students):
            db.add(WellnessCheckin(
                student_id=student.id,
                mood=["Good", "Okay", "Calm", "Low"][index % 4],
                sleep_hours=round(random.uniform(5.5, 8.5), 1),
                energy_level=["High", "Medium", "Low"][index % 3],
                stress_level=["Low", "Moderate", "High"][index % 3],
                score=random.randint(55, 95),
                notes="Synthetic sample check-in. Not a real student record.",
                submitted_at=now - timedelta(days=index * 3),
            ))

        support_requests = []
        for index in range(6):
            student_user, student = students[index]
            assigned = counsellors[index % len(counsellors)][1]
            request = SupportRequest(
                student_id=student.id,
                assigned_counsellor_id=assigned.id if index % 2 == 0 else None,
                category=["Academic", "Emotional wellbeing", "Personal", "Time management"][index % 4],
                priority=["Normal", "High", "Low"][index % 3],
                title=f"Demo support request {index + 1}",
                message="This is fictional text created for demonstrating the support workflow.",
                status=["Open", "In Progress", "Resolved"][index % 3],
                created_at=now - timedelta(days=index + 1),
            )
            db.add(request)
            db.flush()
            support_requests.append(request)

        for index in range(5):
            student = students[index][1]
            db.add(CampusVoiceSubmission(
                student_id=None if index % 2 == 0 else student.id,
                is_anonymous=index % 2 == 0,
                submission_type=["Feedback", "Suggestion", "Concern"][index % 3],
                category=["Campus facilities", "Student support", "Wellbeing"][index % 3],
                title=f"Demo campus voice entry {index + 1}",
                message="Fictional feedback for testing the Campus Voice review screen.",
                status=["Pending", "Reviewed", "In Progress"][index % 3],
                created_at=now - timedelta(days=index + 2),
            ))

        resources = []
        resource_specs = [
            ("Managing exam stress", "Stress management", "Practical study and breathing strategies."),
            ("Building a healthy routine", "Healthy habits", "A sample guide to sleep, breaks, and daily routines."),
            ("How to ask for support", "Student support", "An overview of ways students can seek help."),
            ("Mindful study breaks", "Mindfulness", "Short reset activities between study sessions."),
        ]
        for title, category, description in resource_specs:
            resource = Resource(title=title, category=category, description=description, url="https://example.org/campuswell-demo", is_published=True)
            db.add(resource)
            db.flush()
            resources.append(resource)

        for index in range(4):
            student = students[index][1]
            db.add(SavedResource(student_id=student.id, resource_id=resources[index % len(resources)].id))

        interventions = []
        for index in range(6):
            student = students[index][1]
            counsellor = counsellors[index % len(counsellors)][1]
            intervention = Intervention(
                student_id=student.id,
                counsellor_id=counsellor.id,
                title=["Weekly planning", "Stress coping plan", "Wellbeing check-in plan"][index % 3],
                intervention_type=["Academic support", "Wellbeing", "Skill building"][index % 3],
                description="Synthetic intervention description for demonstrating counsellor workflows.",
                status=["Active", "Completed", "Paused"][index % 3],
                start_date=date.today() - timedelta(days=14 + index),
                end_date=None,
            )
            db.add(intervention)
            db.flush()
            interventions.append(intervention)

        for index in range(6):
            student = students[index][1]
            counsellor = counsellors[index % len(counsellors)][1]
            appointment = appointments[index]
            db.add(FollowUp(
                student_id=student.id,
                counsellor_id=counsellor.id,
                appointment_id=appointment.id,
                due_at=now + timedelta(days=index + 1),
                mode="Online" if index % 2 else "In-person",
                status="Scheduled" if index % 2 == 0 else "Completed",
                notes="Synthetic follow-up for demo purposes.",
                outcome=None,
            ))
            intervention = interventions[index]
            db.add(OutcomeRecord(
                student_id=student.id,
                counsellor_id=counsellor.id,
                intervention_id=intervention.id,
                initial_assessment=random.randint(40, 65),
                latest_assessment=random.randint(60, 90),
                goals_done=index % 4,
                goals_total=4,
                intervention_type=intervention.intervention_type,
                outcome_status=["Improving", "Stable", "In Progress"][index % 3],
                evaluation_date=date.today() - timedelta(days=index),
                notes="Synthetic outcome record. Not a clinical assessment.",
            ))

        notification_targets = [(admin, "Admin demo ready")]
        notification_targets.extend((user, "Welcome to the CampusWell demo") for user, _ in students)
        notification_targets.extend((user, "Welcome to the counsellor demo") for user, _ in counsellors)
        for user, title in notification_targets:
            db.add(Notification(
                user_id=user.id,
                title=title,
                message="This is a sample in-app notification generated for the demo dataset.",
                notification_type="system",
                target_url="/",
                is_read=False,
            ))

        db.commit()
        print("CampusWell synthetic demo dataset created successfully.")
        print("Admin: admin@campuswell.demo")
        print("Counsellors: counsellor1@campuswell.demo, counsellor2@campuswell.demo")
        print("Students: student1@campuswell.demo through student8@campuswell.demo")
        print(f"Demo password for all demo accounts: {DEMO_PASSWORD}")
        print("Change or remove all demo accounts before any real deployment.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
