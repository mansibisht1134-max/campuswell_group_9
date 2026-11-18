import logging
from datetime import datetime
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from database import Base, engine
import models  # noqa: F401 - registers SQLAlchemy models with Base.metadata

from fastapi import Depends
from sqlalchemy.orm import Session

from auth import create_access_token, get_current_user, hash_password, verify_password
from database import get_db
from models import Appointment, CounsellorProfile, StudentProfile, User
from schemas import (
    AppointmentCreate, AppointmentResponse, AppointmentStatusUpdate,
    AuthResponse, LoginRequest, StudentRegister, UserResponse,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("campuswell")

app = FastAPI(
    title="CampusWell API",
    description="Backend API for the CampusWell Student Wellness Management System",
    version="1.0.0",
)

# GitHub Pages is the current frontend host. Add local development origins
# and any future custom frontend domain through the CORS_ORIGINS environment variable.
default_origins = [
    "https://mansibisht1134-max.github.io",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
configured_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins or default_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def create_database_tables():
    # Initial development convenience. Use Alembic migrations before production.
    Base.metadata.create_all(bind=engine)


@app.get("/", tags=["System"])
def home():
    return {
        "name": "CampusWell API",
        "message": "CampusWell backend is running.",
        "docs": "/docs",
        "health": "/api/v1/health",
    }


@app.get("/health", tags=["System"])
def basic_health_check():
    return {"status": "healthy", "service": "CampusWell API"}


@app.get("/api/v1/health", tags=["System"])
def health_check():
    """Check both API availability and the configured database connection."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "service": "CampusWell API",
            "database": "connected",
        }
    except SQLAlchemyError:
        logger.exception("CampusWell database health check failed")
        raise HTTPException(
            status_code=503,
            detail={
                "status": "degraded",
                "service": "CampusWell API",
                "database": "unavailable",
                "message": "Check the DATABASE_URL configuration and database service.",
            },
        )



@app.post("/api/v1/auth/register/student", response_model=AuthResponse, status_code=201, tags=["Authentication"])
def register_student(payload: StudentRegister, db: Session = Depends(get_db)):
    """Create a student account. Counsellor and admin accounts are provisioned by administrators."""
    email = payload.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    if payload.student_number and db.query(StudentProfile).filter(
        StudentProfile.student_number == payload.student_number
    ).first():
        raise HTTPException(status_code=409, detail="This student number is already registered.")

    user = User(email=email, password_hash=hash_password(payload.password), role="student")
    db.add(user)
    db.flush()
    profile = StudentProfile(
        user_id=user.id,
        full_name=payload.full_name.strip(),
        student_number=payload.student_number,
        department=payload.department,
        course=payload.course,
        year_of_study=payload.year_of_study,
    )
    db.add(profile)
    db.commit()
    db.refresh(user)
    token = create_access_token(user)
    return {"access_token": token, "user": user}


@app.post("/api/v1/auth/login", response_model=AuthResponse, tags=["Authentication"])
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    return {"access_token": create_access_token(user), "user": user}


@app.get("/api/v1/auth/me", response_model=UserResponse, tags=["Authentication"])
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user



@app.get("/api/v1/counsellors", tags=["Appointments"])
def list_counsellors(db: Session = Depends(get_db)):
    """List active counsellor profiles for the student booking screen."""
    rows = (
        db.query(CounsellorProfile)
        .join(User, CounsellorProfile.user_id == User.id)
        .filter(User.is_active.is_(True), CounsellorProfile.is_available.is_(True))
        .order_by(CounsellorProfile.full_name)
        .all()
    )
    return [
        {
            "id": row.id,
            "full_name": row.full_name,
            "specialization": row.specialization,
            "qualification": row.qualification,
        }
        for row in rows
    ]


@app.post(
    "/api/v1/appointments",
    response_model=AppointmentResponse,
    status_code=201,
    tags=["Appointments"],
)
def create_appointment(
    payload: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can book appointments.")
    student = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if student is None:
        raise HTTPException(status_code=400, detail="Student profile is missing.")
    counsellor = db.query(CounsellorProfile).join(User).filter(
        CounsellorProfile.id == payload.counsellor_id,
        User.is_active.is_(True),
        CounsellorProfile.is_available.is_(True),
    ).first()
    if counsellor is None:
        raise HTTPException(status_code=404, detail="Available counsellor not found.")
    if payload.scheduled_at.replace(tzinfo=None) <= datetime.utcnow():
        raise HTTPException(status_code=422, detail="Appointment must be scheduled in the future.")

    appointment = Appointment(
        student_id=student.id,
        counsellor_id=counsellor.id,
        scheduled_at=payload.scheduled_at,
        mode=payload.mode,
        reason=payload.reason,
        message=payload.message,
        status="Pending",
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@app.get("/api/v1/appointments", response_model=list[AppointmentResponse], tags=["Appointments"])
def list_my_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "student":
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
        if profile is None:
            raise HTTPException(status_code=400, detail="Student profile is missing.")
        return db.query(Appointment).filter(
            Appointment.student_id == profile.id
        ).order_by(Appointment.scheduled_at.desc()).all()
    if current_user.role == "counsellor":
        profile = db.query(CounsellorProfile).filter(CounsellorProfile.user_id == current_user.id).first()
        if profile is None:
            raise HTTPException(status_code=400, detail="Counsellor profile is missing.")
        return db.query(Appointment).filter(
            Appointment.counsellor_id == profile.id
        ).order_by(Appointment.scheduled_at.desc()).all()
    if current_user.role == "admin":
        return db.query(Appointment).order_by(Appointment.scheduled_at.desc()).all()
    raise HTTPException(status_code=403, detail="Not authorized.")


@app.patch(
    "/api/v1/appointments/{appointment_id}/status",
    response_model=AppointmentResponse,
    tags=["Appointments"],
)
def update_appointment_status(
    appointment_id: int,
    payload: AppointmentStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    if current_user.role == "counsellor":
        profile = db.query(CounsellorProfile).filter(
            CounsellorProfile.user_id == current_user.id
        ).first()
        if profile is None or appointment.counsellor_id != profile.id:
            raise HTTPException(status_code=403, detail="You cannot update this appointment.")
        if payload.status not in {"Confirmed", "Declined", "Completed"}:
            raise HTTPException(status_code=403, detail="Counsellors cannot set this status.")
    elif current_user.role == "student":
        profile = db.query(StudentProfile).filter(
            StudentProfile.user_id == current_user.id
        ).first()
        if profile is None or appointment.student_id != profile.id or payload.status != "Cancelled":
            raise HTTPException(status_code=403, detail="You cannot update this appointment.")
    elif current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized.")
    appointment.status = payload.status
    db.commit()
    db.refresh(appointment)
    return appointment
