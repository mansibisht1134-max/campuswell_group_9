import logging
from datetime import datetime
import os
import secrets
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from database import Base, engine
import models  # noqa: F401 - registers SQLAlchemy models with Base.metadata

from fastapi import Depends
from sqlalchemy.orm import Session

from auth import JWT_SECRET, create_access_token, get_current_user, get_optional_current_user, hash_password, verify_password
from database import get_db
from models import Appointment, CampusVoiceSubmission, CounsellorProfile, FollowUp, Intervention, OutcomeRecord, Resource, SavedResource, StudentProfile, SupportRequest, User, WellnessCheckin
from schemas import (
    AppointmentCreate, AppointmentResponse, AppointmentStatusUpdate,
    AuthResponse, LoginRequest, StudentRegister, UserResponse,
    WellnessCheckinCreate, WellnessCheckinResponse,
    SupportRequestCreate, SupportRequestUpdate, SupportRequestResponse,
    CampusVoiceCreate, CampusVoiceStatusUpdate, CampusVoiceResponse,
    ResourceCreate, ResourceUpdate, ResourceResponse,
    AdminBootstrap, CounsellorCreate, CounsellorProfileUpdate, CounsellorProfileResponse,\n    CounsellorStudentResponse, FollowUpCreate, FollowUpUpdate, FollowUpResponse,\n    InterventionCreate, InterventionUpdate, InterventionResponse, OutcomeCreate, OutcomeUpdate, OutcomeResponse,
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
    if not JWT_SECRET:
        raise HTTPException(status_code=503, detail="Authentication is not configured. Set JWT_SECRET.")
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



@app.post(
    "/api/v1/wellness/checkins",
    response_model=WellnessCheckinResponse,
    status_code=201,
    tags=["Wellness"],
)
def create_wellness_checkin(
    payload: WellnessCheckinCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save a private wellness check-in for the authenticated student."""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can submit wellness check-ins.")
    student = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if student is None:
        raise HTTPException(status_code=400, detail="Student profile is missing.")

    checkin = WellnessCheckin(
        student_id=student.id,
        mood=payload.mood,
        sleep_hours=payload.sleep_hours,
        energy_level=payload.energy_level,
        stress_level=payload.stress_level,
        score=payload.score,
        notes=payload.notes,
    )
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    return checkin


@app.get(
    "/api/v1/wellness/checkins",
    response_model=list[WellnessCheckinResponse],
    tags=["Wellness"],
)
def list_my_wellness_checkins(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Students can retrieve only their own wellness history."""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Use the counsellor-scoped wellness endpoint.")
    student = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if student is None:
        raise HTTPException(status_code=400, detail="Student profile is missing.")
    return (
        db.query(WellnessCheckin)
        .filter(WellnessCheckin.student_id == student.id)
        .order_by(WellnessCheckin.submitted_at.desc())
        .all()
    )


@app.get(
    "/api/v1/wellness/students/{student_id}/checkins",
    response_model=list[WellnessCheckinResponse],
    tags=["Wellness"],
)
def list_student_wellness_for_counsellor(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """A counsellor may view records only for a student linked through their appointments."""
    if current_user.role != "counsellor":
        raise HTTPException(status_code=403, detail="Only counsellors can use this endpoint.")
    counsellor = db.query(CounsellorProfile).filter(
        CounsellorProfile.user_id == current_user.id
    ).first()
    if counsellor is None:
        raise HTTPException(status_code=400, detail="Counsellor profile is missing.")

    linked_student = db.query(Appointment.id).filter(
        Appointment.counsellor_id == counsellor.id,
        Appointment.student_id == student_id,
    ).first()
    if linked_student is None:
        raise HTTPException(status_code=403, detail="You are not assigned to this student.")

    return (
        db.query(WellnessCheckin)
        .filter(WellnessCheckin.student_id == student_id)
        .order_by(WellnessCheckin.submitted_at.desc())
        .all()
    )


@app.post(
    "/api/v1/support/requests",
    response_model=SupportRequestResponse,
    status_code=201,
    tags=["Support"],
)
def create_support_request(
    payload: SupportRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Allow a signed-in student to submit a private support request."""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can create support requests.")
    student = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if student is None:
        raise HTTPException(status_code=400, detail="Student profile is missing.")
    request = SupportRequest(
        student_id=student.id,
        category=payload.category,
        title=payload.title,
        message=payload.message,
        priority=payload.priority,
        status="Open",
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


@app.get(
    "/api/v1/support/requests",
    response_model=list[SupportRequestResponse],
    tags=["Support"],
)
def list_support_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return only support requests the signed-in role is permitted to access."""
    if current_user.role == "student":
        student = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
        if student is None:
            raise HTTPException(status_code=400, detail="Student profile is missing.")
        query = db.query(SupportRequest).filter(SupportRequest.student_id == student.id)
    elif current_user.role == "counsellor":
        counsellor = db.query(CounsellorProfile).filter(
            CounsellorProfile.user_id == current_user.id
        ).first()
        if counsellor is None:
            raise HTTPException(status_code=400, detail="Counsellor profile is missing.")
        query = db.query(SupportRequest).filter(
            SupportRequest.assigned_counsellor_id == counsellor.id
        )
    elif current_user.role == "admin":
        query = db.query(SupportRequest)
    else:
        raise HTTPException(status_code=403, detail="Not authorized.")
    return query.order_by(SupportRequest.created_at.desc()).all()


@app.patch(
    "/api/v1/support/requests/{request_id}",
    response_model=SupportRequestResponse,
    tags=["Support"],
)
def update_support_request(
    request_id: int,
    payload: SupportRequestUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admins can assign requests; assigned counsellors can update their workflow status."""
    request = db.query(SupportRequest).filter(SupportRequest.id == request_id).first()
    if request is None:
        raise HTTPException(status_code=404, detail="Support request not found.")

    if current_user.role == "admin":
        if payload.assigned_counsellor_id is not None:
            counsellor = db.query(CounsellorProfile).join(User).filter(
                CounsellorProfile.id == payload.assigned_counsellor_id,
                User.is_active.is_(True),
            ).first()
            if counsellor is None:
                raise HTTPException(status_code=404, detail="Counsellor not found.")
            request.assigned_counsellor_id = counsellor.id
        if payload.status is not None:
            request.status = payload.status
    elif current_user.role == "counsellor":
        counsellor = db.query(CounsellorProfile).filter(
            CounsellorProfile.user_id == current_user.id
        ).first()
        if counsellor is None or request.assigned_counsellor_id != counsellor.id:
            raise HTTPException(status_code=403, detail="This request is not assigned to you.")
        if payload.assigned_counsellor_id is not None:
            raise HTTPException(status_code=403, detail="Counsellors cannot reassign requests.")
        if payload.status is not None:
            request.status = payload.status
    else:
        raise HTTPException(status_code=403, detail="Not authorized to update support requests.")

    db.commit()
    db.refresh(request)
    return request



@app.post(
    "/api/v1/campus-voice",
    response_model=CampusVoiceResponse,
    status_code=201,
    tags=["Campus Voice"],
)
def create_campus_voice_submission(
    payload: CampusVoiceCreate,
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Accept anonymous submissions without storing a student identity."""
    student_id = None
    if not payload.is_anonymous:
        if current_user is None or current_user.role != "student":
            raise HTTPException(
                status_code=401,
                detail="Sign in with a student account to submit non-anonymous feedback.",
            )
        student = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
        if student is None:
            raise HTTPException(status_code=400, detail="Student profile is missing.")
        student_id = student.id

    submission = CampusVoiceSubmission(
        student_id=student_id,
        is_anonymous=payload.is_anonymous,
        submission_type=payload.submission_type,
        category=payload.category,
        title=payload.title,
        message=payload.message,
        status="Pending",
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@app.get(
    "/api/v1/campus-voice",
    response_model=list[CampusVoiceResponse],
    tags=["Campus Voice"],
)
def list_campus_voice_submissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Only counsellors and admins can review; identity fields are never returned."""
    if current_user.role not in {"counsellor", "admin"}:
        raise HTTPException(status_code=403, detail="Not authorized to review Campus Voice submissions.")
    return (
        db.query(CampusVoiceSubmission)
        .order_by(CampusVoiceSubmission.created_at.desc())
        .all()
    )


@app.patch(
    "/api/v1/campus-voice/{submission_id}/status",
    response_model=CampusVoiceResponse,
    tags=["Campus Voice"],
)
def update_campus_voice_status(
    submission_id: int,
    payload: CampusVoiceStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in {"counsellor", "admin"}:
        raise HTTPException(status_code=403, detail="Not authorized to update Campus Voice submissions.")
    submission = db.query(CampusVoiceSubmission).filter(
        CampusVoiceSubmission.id == submission_id
    ).first()
    if submission is None:
        raise HTTPException(status_code=404, detail="Campus Voice submission not found.")
    submission.status = payload.status
    db.commit()
    db.refresh(submission)
    return submission



@app.get("/api/v1/resources", response_model=list[ResourceResponse], tags=["Resources"])
def list_published_resources(
    category: str | None = None,
    db: Session = Depends(get_db),
):
    """Browse published wellness resources; optional category filtering is case-insensitive."""
    query = db.query(Resource).filter(Resource.is_published.is_(True))
    if category:
        query = query.filter(Resource.category.ilike(category.strip()))
    return query.order_by(Resource.created_at.desc()).all()


@app.post(
    "/api/v1/resources",
    response_model=ResourceResponse,
    status_code=201,
    tags=["Resources"],
)
def create_resource(
    payload: ResourceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can publish resources.")
    resource = Resource(**payload.model_dump())
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


@app.patch(
    "/api/v1/resources/{resource_id}",
    response_model=ResourceResponse,
    tags=["Resources"],
)
def update_resource(
    resource_id: int,
    payload: ResourceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update resources.")
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if resource is None:
        raise HTTPException(status_code=404, detail="Resource not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(resource, field, value)
    db.commit()
    db.refresh(resource)
    return resource


@app.post(
    "/api/v1/resources/{resource_id}/save",
    status_code=201,
    tags=["Resources"],
)
def save_resource(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can save resources.")
    student = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if student is None:
        raise HTTPException(status_code=400, detail="Student profile is missing.")
    resource = db.query(Resource).filter(
        Resource.id == resource_id,
        Resource.is_published.is_(True),
    ).first()
    if resource is None:
        raise HTTPException(status_code=404, detail="Published resource not found.")
    saved = db.query(SavedResource).filter(
        SavedResource.student_id == student.id,
        SavedResource.resource_id == resource.id,
    ).first()
    if saved is None:
        saved = SavedResource(student_id=student.id, resource_id=resource.id)
        db.add(saved)
        db.commit()
    return {"message": "Resource saved.", "resource_id": resource.id}


@app.get(
    "/api/v1/resources/saved",
    response_model=list[ResourceResponse],
    tags=["Resources"],
)
def list_saved_resources(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can view saved resources.")
    student = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if student is None:
        raise HTTPException(status_code=400, detail="Student profile is missing.")
    return (
        db.query(Resource)
        .join(SavedResource, SavedResource.resource_id == Resource.id)
        .filter(
            SavedResource.student_id == student.id,
            Resource.is_published.is_(True),
        )
        .order_by(SavedResource.saved_at.desc())
        .all()
    )


@app.delete(
    "/api/v1/resources/{resource_id}/save",
    status_code=204,
    tags=["Resources"],
)
def unsave_resource(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can remove saved resources.")
    student = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if student is None:
        raise HTTPException(status_code=400, detail="Student profile is missing.")
    saved = db.query(SavedResource).filter(
        SavedResource.student_id == student.id,
        SavedResource.resource_id == resource_id,
    ).first()
    if saved is None:
        raise HTTPException(status_code=404, detail="Saved resource not found.")
    db.delete(saved)
    db.commit()



@app.post("/api/v1/admin/bootstrap", response_model=AuthResponse, status_code=201, tags=["Administration"])
def bootstrap_first_admin(
    payload: AdminBootstrap,
    x_bootstrap_token: str | None = Header(default=None, alias="X-Bootstrap-Token"),
    db: Session = Depends(get_db),
):
    """Create the first admin only, using a one-time deployment secret."""
    expected_token = os.getenv("ADMIN_BOOTSTRAP_TOKEN")
    if not expected_token or not x_bootstrap_token or not secrets.compare_digest(
        x_bootstrap_token, expected_token
    ):
        raise HTTPException(status_code=403, detail="Invalid or missing bootstrap credential.")
    if not JWT_SECRET:
        raise HTTPException(status_code=503, detail="Authentication is not configured. Set JWT_SECRET.")
    if db.query(User).filter(User.role == "admin").first():
        raise HTTPException(status_code=409, detail="An administrator already exists.")
    email = payload.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    admin = User(email=email, password_hash=hash_password(payload.password), role="admin")
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return {"access_token": create_access_token(admin), "user": admin}


@app.post(
    "/api/v1/admin/counsellors",
    response_model=CounsellorProfileResponse,
    status_code=201,
    tags=["Administration"],
)
def create_counsellor_account(
    payload: CounsellorCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create counsellor accounts.")
    if not JWT_SECRET:
        raise HTTPException(status_code=503, detail="Authentication is not configured. Set JWT_SECRET.")
    email = payload.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    if payload.employee_id and db.query(CounsellorProfile).filter(
        CounsellorProfile.employee_id == payload.employee_id
    ).first():
        raise HTTPException(status_code=409, detail="This employee ID is already registered.")

    user = User(email=email, password_hash=hash_password(payload.password), role="counsellor")
    db.add(user)
    db.flush()
    profile = CounsellorProfile(
        user_id=user.id,
        full_name=payload.full_name.strip(),
        employee_id=payload.employee_id,
        specialization=payload.specialization,
        qualification=payload.qualification,
        phone=payload.phone,
        is_available=payload.is_available,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return {
        "id": profile.id,
        "full_name": profile.full_name,
        "email": user.email,
        "employee_id": profile.employee_id,
        "specialization": profile.specialization,
        "qualification": profile.qualification,
        "phone": profile.phone,
        "is_available": profile.is_available,
    }


@app.get(
    "/api/v1/admin/counsellors",
    response_model=list[CounsellorProfileResponse],
    tags=["Administration"],
)
def admin_list_counsellors(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can manage counsellors.")
    profiles = db.query(CounsellorProfile).join(User).order_by(CounsellorProfile.full_name).all()
    return [
        {
            "id": profile.id,
            "full_name": profile.full_name,
            "email": profile.user.email,
            "employee_id": profile.employee_id,
            "specialization": profile.specialization,
            "qualification": profile.qualification,
            "phone": profile.phone,
            "is_available": profile.is_available,
        }
        for profile in profiles
    ]


@app.get(
    "/api/v1/counsellors/me",
    response_model=CounsellorProfileResponse,
    tags=["Counsellors"],
)
def get_my_counsellor_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "counsellor":
        raise HTTPException(status_code=403, detail="Counsellor account required.")
    profile = db.query(CounsellorProfile).filter(
        CounsellorProfile.user_id == current_user.id
    ).first()
    if profile is None:
        raise HTTPException(status_code=404, detail="Counsellor profile not found.")
    return {
        "id": profile.id,
        "full_name": profile.full_name,
        "email": current_user.email,
        "employee_id": profile.employee_id,
        "specialization": profile.specialization,
        "qualification": profile.qualification,
        "phone": profile.phone,
        "is_available": profile.is_available,
    }


@app.patch(
    "/api/v1/counsellors/me",
    response_model=CounsellorProfileResponse,
    tags=["Counsellors"],
)
def update_my_counsellor_profile(
    payload: CounsellorProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "counsellor":
        raise HTTPException(status_code=403, detail="Counsellor account required.")
    profile = db.query(CounsellorProfile).filter(
        CounsellorProfile.user_id == current_user.id
    ).first()
    if profile is None:
        raise HTTPException(status_code=404, detail="Counsellor profile not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return {
        "id": profile.id,
        "full_name": profile.full_name,
        "email": current_user.email,
        "employee_id": profile.employee_id,
        "specialization": profile.specialization,
        "qualification": profile.qualification,
        "phone": profile.phone,
        "is_available": profile.is_available,
    }



def get_counsellor_profile(current_user: User, db: Session) -> CounsellorProfile:
    if current_user.role != "counsellor":
        raise HTTPException(status_code=403, detail="Counsellor account required.")
    profile = db.query(CounsellorProfile).filter(
        CounsellorProfile.user_id == current_user.id
    ).first()
    if profile is None:
        raise HTTPException(status_code=400, detail="Counsellor profile is missing.")
    return profile


def ensure_counsellor_student_access(counsellor_id: int, student_id: int, db: Session):
    appointment_link = db.query(Appointment.id).filter(
        Appointment.counsellor_id == counsellor_id,
        Appointment.student_id == student_id,
    ).first()
    support_link = db.query(SupportRequest.id).filter(
        SupportRequest.assigned_counsellor_id == counsellor_id,
        SupportRequest.student_id == student_id,
    ).first()
    if appointment_link is None and support_link is None:
        raise HTTPException(status_code=403, detail="This student is not assigned to you.")
    student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found.")
    return student


@app.get(
    "/api/v1/counsellor/students",
    response_model=list[CounsellorStudentResponse],
    tags=["Counsellors"],
)
def list_counsellor_students(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List distinct students connected through appointments or assigned support requests."""
    counsellor = get_counsellor_profile(current_user, db)
    appointment_ids = db.query(Appointment.student_id).filter(
        Appointment.counsellor_id == counsellor.id
    )
    support_student_ids = db.query(SupportRequest.student_id).filter(
        SupportRequest.assigned_counsellor_id == counsellor.id
    )
    student_ids = {row[0] for row in appointment_ids.all()}
    student_ids.update(row[0] for row in support_student_ids.all())
    if not student_ids:
        return []
    students = db.query(StudentProfile).filter(
        StudentProfile.id.in_(student_ids)
    ).order_by(StudentProfile.full_name).all()
    return students


@app.post(
    "/api/v1/counsellor/follow-ups",
    response_model=FollowUpResponse,
    status_code=201,
    tags=["Counsellors"],
)
def create_follow_up(
    payload: FollowUpCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    counsellor = get_counsellor_profile(current_user, db)
    ensure_counsellor_student_access(counsellor.id, payload.student_id, db)
    if payload.appointment_id is not None:
        appointment = db.query(Appointment).filter(
            Appointment.id == payload.appointment_id,
            Appointment.counsellor_id == counsellor.id,
            Appointment.student_id == payload.student_id,
        ).first()
        if appointment is None:
            raise HTTPException(status_code=404, detail="Linked appointment not found.")
    follow_up = FollowUp(
        student_id=payload.student_id,
        counsellor_id=counsellor.id,
        appointment_id=payload.appointment_id,
        due_at=payload.due_at,
        mode=payload.mode,
        status="Scheduled",
        notes=payload.notes,
    )
    db.add(follow_up)
    db.commit()
    db.refresh(follow_up)
    return follow_up


@app.get(
    "/api/v1/counsellor/follow-ups",
    response_model=list[FollowUpResponse],
    tags=["Counsellors"],
)
def list_follow_ups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    counsellor = get_counsellor_profile(current_user, db)
    return db.query(FollowUp).filter(
        FollowUp.counsellor_id == counsellor.id
    ).order_by(FollowUp.due_at.asc()).all()


@app.patch(
    "/api/v1/counsellor/follow-ups/{follow_up_id}",
    response_model=FollowUpResponse,
    tags=["Counsellors"],
)
def update_follow_up(
    follow_up_id: int,
    payload: FollowUpUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    counsellor = get_counsellor_profile(current_user, db)
    follow_up = db.query(FollowUp).filter(
        FollowUp.id == follow_up_id,
        FollowUp.counsellor_id == counsellor.id,
    ).first()
    if follow_up is None:
        raise HTTPException(status_code=404, detail="Follow-up not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(follow_up, field, value)
    db.commit()
    db.refresh(follow_up)
    return follow_up


@app.post(
    "/api/v1/counsellor/interventions",
    response_model=InterventionResponse,
    status_code=201,
    tags=["Counsellors"],
)
def create_intervention(
    payload: InterventionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    counsellor = get_counsellor_profile(current_user, db)
    ensure_counsellor_student_access(counsellor.id, payload.student_id, db)
    intervention = Intervention(
        student_id=payload.student_id,
        counsellor_id=counsellor.id,
        title=payload.title,
        intervention_type=payload.intervention_type,
        description=payload.description,
        status=payload.status,
        start_date=payload.start_date,
        end_date=payload.end_date,
    )
    db.add(intervention)
    db.commit()
    db.refresh(intervention)
    return intervention


@app.get(
    "/api/v1/counsellor/interventions",
    response_model=list[InterventionResponse],
    tags=["Counsellors"],
)
def list_interventions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    counsellor = get_counsellor_profile(current_user, db)
    return db.query(Intervention).filter(
        Intervention.counsellor_id == counsellor.id
    ).order_by(Intervention.created_at.desc()).all()


@app.patch(
    "/api/v1/counsellor/interventions/{intervention_id}",
    response_model=InterventionResponse,
    tags=["Counsellors"],
)
def update_intervention(
    intervention_id: int,
    payload: InterventionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    counsellor = get_counsellor_profile(current_user, db)
    intervention = db.query(Intervention).filter(
        Intervention.id == intervention_id,
        Intervention.counsellor_id == counsellor.id,
    ).first()
    if intervention is None:
        raise HTTPException(status_code=404, detail="Intervention not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(intervention, field, value)
    db.commit()
    db.refresh(intervention)
    return intervention


@app.post(
    "/api/v1/counsellor/outcomes",
    response_model=OutcomeResponse,
    status_code=201,
    tags=["Counsellors"],
)
def create_outcome_record(
    payload: OutcomeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    counsellor = get_counsellor_profile(current_user, db)
    ensure_counsellor_student_access(counsellor.id, payload.student_id, db)
    if payload.intervention_id is not None:
        intervention = db.query(Intervention).filter(
            Intervention.id == payload.intervention_id,
            Intervention.counsellor_id == counsellor.id,
            Intervention.student_id == payload.student_id,
        ).first()
        if intervention is None:
            raise HTTPException(status_code=404, detail="Linked intervention not found.")
    outcome = OutcomeRecord(
        student_id=payload.student_id,
        counsellor_id=counsellor.id,
        intervention_id=payload.intervention_id,
        initial_assessment=payload.initial_assessment,
        latest_assessment=payload.latest_assessment,
        goals_done=payload.goals_done,
        goals_total=payload.goals_total,
        intervention_type=payload.intervention_type,
        outcome_status=payload.outcome_status,
        evaluation_date=payload.evaluation_date,
        notes=payload.notes,
    )
    db.add(outcome)
    db.commit()
    db.refresh(outcome)
    return outcome


@app.get(
    "/api/v1/counsellor/outcomes",
    response_model=list[OutcomeResponse],
    tags=["Counsellors"],
)
def list_outcome_records(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    counsellor = get_counsellor_profile(current_user, db)
    return db.query(OutcomeRecord).filter(
        OutcomeRecord.counsellor_id == counsellor.id
    ).order_by(OutcomeRecord.created_at.desc()).all()


@app.patch(
    "/api/v1/counsellor/outcomes/{outcome_id}",
    response_model=OutcomeResponse,
    tags=["Counsellors"],
)
def update_outcome_record(
    outcome_id: int,
    payload: OutcomeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    counsellor = get_counsellor_profile(current_user, db)
    outcome = db.query(OutcomeRecord).filter(
        OutcomeRecord.id == outcome_id,
        OutcomeRecord.counsellor_id == counsellor.id,
    ).first()
    if outcome is None:
        raise HTTPException(status_code=404, detail="Outcome record not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(outcome, field, value)
    db.commit()
    db.refresh(outcome)
    return outcome
