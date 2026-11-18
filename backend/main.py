import logging
from datetime import datetime, timedelta
import os
import secrets
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from database import engine
import models  # noqa: F401 - registers SQLAlchemy models with Base.metadata

from fastapi import Depends
from sqlalchemy.orm import Session

from auth import JWT_SECRET, create_access_token, get_current_user, get_optional_current_user, hash_password, verify_password
from database import get_db
from models import Appointment, CampusVoiceSubmission, CounsellorProfile, FollowUp, Intervention, Notification, OutcomeRecord, Resource, SavedResource, StudentProfile, SupportRequest, User, WellnessCheckin
from schemas import (
    AppointmentCreate, AppointmentResponse, AppointmentStatusUpdate,
    AuthResponse, LoginRequest, PasswordChange, StudentRegister, UserResponse,
    WellnessCheckinCreate, WellnessCheckinResponse,
    SupportRequestCreate, SupportRequestUpdate, SupportRequestResponse,
    CampusVoiceCreate, CampusVoiceStatusUpdate, CampusVoiceResponse,
    ResourceCreate, ResourceUpdate, ResourceResponse,
    AdminBootstrap, AdminPasswordReset, CounsellorCreate, CounsellorProfileUpdate, CounsellorProfileResponse,
    CounsellorStudentResponse, FollowUpCreate, FollowUpUpdate, FollowUpResponse,
    InterventionCreate, InterventionUpdate, InterventionResponse, OutcomeCreate, OutcomeUpdate, OutcomeResponse,
    NotificationResponse, NotificationReadUpdate, AdminAnalyticsOverview,
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



@app.post("/api/v1/auth/change-password", tags=["Authentication"])
def change_password(
    payload: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change the authenticated user's password after verifying the current password."""
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    if verify_password(payload.new_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Choose a password different from the current password.")
    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password changed successfully. Please sign in again."}


@app.get("/api/v1/auth/me", response_model=UserResponse, tags=["Authentication"])
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user



@app.get("/api/v1/student/profile", tags=["Students"])
def read_student_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the authenticated student's own profile details."""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can access this profile.")
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if profile is None:
        raise HTTPException(status_code=404, detail="Student profile not found.")
    return {
        "id": profile.id,
        "email": current_user.email,
        "full_name": profile.full_name,
        "student_number": profile.student_number,
        "department": profile.department,
        "course": profile.course,
        "year_of_study": profile.year_of_study,
        "is_active": current_user.is_active,
    }


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
    add_notification(db, counsellor.user_id, "New appointment request", "A student has requested an appointment. Please review your appointments.", "appointment", "/counsellor/appointments/appointments.html")
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
    student_profile = db.query(StudentProfile).filter(StudentProfile.id == appointment.student_id).first()
    if student_profile:
        add_notification(db, student_profile.user_id, "Appointment updated", f"Your appointment status is now {payload.status}.", "appointment", "/appointments/appointments.html")
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
            add_notification(db, counsellor.user_id, "Support request assigned", "A new student support request has been assigned to you.", "support", "/counsellor/requests/requests.html")
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


@app.post("/api/v1/admin/reset-password", tags=["Administration"])
def reset_first_admin_password(
    payload: AdminPasswordReset,
    x_bootstrap_token: str | None = Header(default=None, alias="X-Bootstrap-Token"),
    db: Session = Depends(get_db),
):
    """Temporarily reset the first admin password using the deployment bootstrap secret."""
    expected_token = os.getenv("ADMIN_BOOTSTRAP_TOKEN")
    if not expected_token or not x_bootstrap_token or not secrets.compare_digest(
        x_bootstrap_token, expected_token
    ):
        raise HTTPException(status_code=403, detail="Invalid or missing reset credential.")
    admin = db.query(User).filter(User.role == "admin").order_by(User.id.asc()).first()
    if admin is None:
        raise HTTPException(status_code=404, detail="Administrator account not found.")
    if payload.email.lower() != admin.email.lower():
        raise HTTPException(status_code=403, detail="Email does not match the first administrator.")
    if verify_password(payload.new_password, admin.password_hash):
        raise HTTPException(status_code=400, detail="Choose a new password different from the current password.")
    admin.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Administrator password reset successfully. Remove ADMIN_BOOTSTRAP_TOKEN from the Render environment now."}


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


@app.get(
    "/api/v1/counsellor/wellness-checkins",
    response_model=list[WellnessCheckinResponse],
    tags=["Counsellors"],
)
def list_counsellor_wellness_checkins(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return check-ins only for students linked to this counsellor's appointments or assigned requests."""
    counsellor = get_counsellor_profile(current_user, db)
    appointment_students = db.query(Appointment.student_id).filter(
        Appointment.counsellor_id == counsellor.id
    ).all()
    request_students = db.query(SupportRequest.student_id).filter(
        SupportRequest.assigned_counsellor_id == counsellor.id
    ).all()
    student_ids = {row[0] for row in appointment_students}
    student_ids.update(row[0] for row in request_students)
    if not student_ids:
        return []
    return db.query(WellnessCheckin).filter(
        WellnessCheckin.student_id.in_(student_ids)
    ).order_by(WellnessCheckin.submitted_at.desc()).all()


@app.get(
    "/api/v1/counsellor/wellness-insights",
    tags=["Counsellors", "Wellness"],
)
def counsellor_wellness_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Explainable, non-diagnostic early-warning indicators for linked students only."""
    counsellor = get_counsellor_profile(current_user, db)
    appointment_students = db.query(Appointment.student_id).filter(
        Appointment.counsellor_id == counsellor.id
    ).all()
    request_students = db.query(SupportRequest.student_id).filter(
        SupportRequest.assigned_counsellor_id == counsellor.id
    ).all()
    student_ids = {row[0] for row in appointment_students}
    student_ids.update(row[0] for row in request_students)
    results = []
    for student in db.query(StudentProfile).filter(
        StudentProfile.id.in_(student_ids)
    ).all() if student_ids else []:
        records = db.query(WellnessCheckin).filter(
            WellnessCheckin.student_id == student.id
        ).order_by(WellnessCheckin.submitted_at.desc()).limit(3).all()
        if not records:
            continue
        latest = records[0]
        points = 0
        reasons = []
        stress = (latest.stress_level or "").strip().lower()
        mood = (latest.mood or "").strip().lower()
        energy = (latest.energy_level or "").strip().lower()
        if stress in {"very high", "high"}:
            points += 30
            reasons.append("High reported stress")
        elif stress == "moderate":
            points += 12
            reasons.append("Moderate reported stress")
        if mood == "stressed":
            points += 25
            reasons.append("Reported feeling stressed")
        elif mood == "low":
            points += 20
            reasons.append("Reported low mood")
        elif mood == "okay":
            points += 5
        if latest.sleep_hours is not None:
            if latest.sleep_hours < 5:
                points += 20
                reasons.append("Less than 5 hours of reported sleep")
            elif latest.sleep_hours < 6:
                points += 10
                reasons.append("Less than 6 hours of reported sleep")
        if energy == "low":
            points += 15
            reasons.append("Low reported energy")
        elif energy == "moderate":
            points += 5
        if latest.score is not None:
            if latest.score < 50:
                points += 20
                reasons.append("Latest self-reported wellness score below 50")
            elif latest.score < 65:
                points += 10
                reasons.append("Latest self-reported wellness score below 65")
        low_scores = sum(1 for item in records if item.score is not None and item.score < 60)
        if len(records) >= 2 and low_scores >= 2:
            points += 10
            reasons.append("More than one recent check-in below 60")
        points = min(points, 100)
        level = "Elevated" if points >= 50 else "Watch" if points >= 25 else "Routine"
        results.append({
            "student_id": student.id,
            "student_name": student.full_name,
            "indicator_score": points,
            "indicator_level": level,
            "reasons": reasons or ["No current elevated indicators in the latest check-in"],
            "checkins_reviewed": len(records),
            "latest_checkin": latest.submitted_at,
        })
    results.sort(key=lambda item: (item["indicator_score"], item["latest_checkin"]), reverse=True)
    return {
        "method": "Explainable rule-based screening indicators; not a diagnosis or validated ML prediction.",
        "students_reviewed": len(results),
        "elevated_count": sum(1 for item in results if item["indicator_level"] == "Elevated"),
        "watch_count": sum(1 for item in results if item["indicator_level"] == "Watch"),
        "routine_count": sum(1 for item in results if item["indicator_level"] == "Routine"),
        "items": results,
    }


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
    student_profile = db.query(StudentProfile).filter(StudentProfile.id == payload.student_id).first()
    if student_profile:
        add_notification(db, student_profile.user_id, "Follow-up scheduled", "Your counsellor has scheduled a follow-up with you.", "follow_up", "/appointments/appointments.html")
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
    student_profile = db.query(StudentProfile).filter(StudentProfile.id == payload.student_id).first()
    if student_profile:
        add_notification(db, student_profile.user_id, "Wellness plan updated", "Your counsellor has added a wellness intervention to your support plan.", "intervention", "/wellness/wellness.html")
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


def add_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str,
    target_url: str | None = None,
):
    """Queue an in-app notification in the current database transaction."""
    db.add(Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        target_url=target_url,
        is_read=False,
    ))


@app.get(
    "/api/v1/notifications",
    response_model=list[NotificationResponse],
    tags=["Notifications"],
)
def list_notifications(
    unread_only: bool = False,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return only the signed-in user's notifications, newest first."""
    limit = max(1, min(limit, 100))
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read.is_(False))
    return query.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()


@app.get("/api/v1/notifications/unread-count", tags=["Notifications"])
def unread_notification_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read.is_(False),
    ).count()
    return {"unread_count": count}


@app.patch(
    "/api/v1/notifications/{notification_id}/read",
    response_model=NotificationResponse,
    tags=["Notifications"],
)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found.")
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


@app.post("/api/v1/notifications/read-all", tags=["Notifications"])
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    updated = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read.is_(False),
    ).update({Notification.is_read: True}, synchronize_session=False)
    db.commit()
    return {"message": "All notifications marked as read.", "updated_count": updated}


@app.delete("/api/v1/notifications/{notification_id}", status_code=204, tags=["Notifications"])
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found.")
    db.delete(notification)
    db.commit()



@app.get(
    "/api/v1/admin/analytics/overview",
    response_model=AdminAnalyticsOverview,
    tags=["Administration", "Analytics"],
)
def admin_analytics_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return aggregate operational metrics; no private check-in notes or identities."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view institution-wide analytics.")

    now = datetime.utcnow()
    first_month = (now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                   - timedelta(days=150)).replace(day=1)

    def status_counts(query, column):
        counts = {}
        for value, in query.with_entities(column).all():
            key = value or "Unspecified"
            counts[key] = counts.get(key, 0) + 1
        return counts

    def monthly_counts(query, column):
        rows = query.with_entities(column).all()
        counts = {}
        for value, in rows:
            if value is None:
                continue
            month_key = value.strftime("%Y-%m")
            if month_key >= first_month.strftime("%Y-%m"):
                counts[month_key] = counts.get(month_key, 0) + 1
        result = []
        cursor = first_month
        for _ in range(6):
            key = cursor.strftime("%Y-%m")
            result.append({"month": key, "count": counts.get(key, 0)})
            cursor = (cursor.replace(day=28) + timedelta(days=4)).replace(day=1)
        return result

    appointment_query = db.query(Appointment)
    support_query = db.query(SupportRequest)
    intervention_query = db.query(Intervention)
    appointment_statuses = status_counts(appointment_query, Appointment.status)
    support_statuses = status_counts(support_query, SupportRequest.status)
    intervention_statuses = status_counts(intervention_query, Intervention.status)

    return {
        "total_students": db.query(StudentProfile).join(User).filter(User.role == "student").count(),
        "active_students": db.query(StudentProfile).join(User).filter(User.role == "student", User.is_active.is_(True)).count(),
        "total_counsellors": db.query(CounsellorProfile).join(User).filter(User.role == "counsellor").count(),
        "available_counsellors": db.query(CounsellorProfile).join(User).filter(User.role == "counsellor", User.is_active.is_(True), CounsellorProfile.is_available.is_(True)).count(),
        "total_appointments": appointment_query.count(),
        "pending_appointments": appointment_query.filter(Appointment.status == "Pending").count(),
        "completed_appointments": appointment_query.filter(Appointment.status == "Completed").count(),
        "total_support_requests": support_query.count(),
        "open_support_requests": support_query.filter(SupportRequest.status == "Open").count(),
        "total_wellness_checkins": db.query(WellnessCheckin).count(),
        "total_interventions": intervention_query.count(),
        "active_interventions": intervention_query.filter(Intervention.status == "Active").count(),
        "total_follow_ups": db.query(FollowUp).count(),
        "upcoming_follow_ups": db.query(FollowUp).filter(FollowUp.due_at >= now, FollowUp.status == "Scheduled").count(),
        "total_resources": db.query(Resource).count(),
        "total_campus_voice_submissions": db.query(CampusVoiceSubmission).count(),
        "appointment_statuses": appointment_statuses,
        "support_request_statuses": support_statuses,
        "intervention_statuses": intervention_statuses,
        "monthly_appointments": monthly_counts(appointment_query, Appointment.created_at),
        "monthly_wellness_checkins": monthly_counts(db.query(WellnessCheckin), WellnessCheckin.submitted_at),
    }


@app.get("/api/v1/admin/dashboard/summary", tags=["Administration"])
def admin_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Compact dashboard counters for the admin home screen."""
    overview = admin_analytics_overview(current_user, db)
    return {
        "total_students": overview["total_students"],
        "total_counsellors": overview["total_counsellors"],
        "total_appointments": overview["total_appointments"],
        "pending_appointments": overview["pending_appointments"],
        "open_support_requests": overview["open_support_requests"],
        "total_wellness_checkins": overview["total_wellness_checkins"],
        "active_interventions": overview["active_interventions"],
        "upcoming_follow_ups": overview["upcoming_follow_ups"],
    }

