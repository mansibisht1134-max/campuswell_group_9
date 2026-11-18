from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from database import Base


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, index=True)  # student, counsellor, admin
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    student_profile = relationship("StudentProfile", back_populates="user", uselist=False)
    counsellor_profile = relationship("CounsellorProfile", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String(150), nullable=False)
    student_number = Column(String(50), unique=True, nullable=True, index=True)
    department = Column(String(120), nullable=True)
    course = Column(String(120), nullable=True)
    year_of_study = Column(Integer, nullable=True)
    phone = Column(String(30), nullable=True)

    user = relationship("User", back_populates="student_profile")


class CounsellorProfile(Base):
    __tablename__ = "counsellor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String(150), nullable=False)
    employee_id = Column(String(50), unique=True, nullable=True, index=True)
    specialization = Column(String(200), nullable=True)
    qualification = Column(String(200), nullable=True)
    phone = Column(String(30), nullable=True)
    is_available = Column(Boolean, nullable=False, default=True)

    user = relationship("User", back_populates="counsellor_profile")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    counsellor_id = Column(Integer, ForeignKey("counsellor_profiles.id"), nullable=False, index=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=False, index=True)
    duration_minutes = Column(Integer, nullable=False, default=50)
    mode = Column(String(30), nullable=False, default="In-person")
    reason = Column(String(120), nullable=False)
    message = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="Pending", index=True)
    counsellor_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)


class WellnessCheckin(Base):
    __tablename__ = "wellness_checkins"
    __table_args__ = (
        CheckConstraint("score >= 0 AND score <= 100", name="ck_wellness_score_range"),
    )

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    mood = Column(String(60), nullable=True)
    sleep_hours = Column(Float, nullable=True)
    energy_level = Column(String(40), nullable=True)
    stress_level = Column(String(40), nullable=True)
    score = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=False, default=utc_now, index=True)


class SupportRequest(Base):
    __tablename__ = "support_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_counsellor_id = Column(Integer, ForeignKey("counsellor_profiles.id"), nullable=True, index=True)
    category = Column(String(100), nullable=False)
    priority = Column(String(30), nullable=False, default="Normal")
    title = Column(String(180), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(30), nullable=False, default="Open", index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)


class CampusVoiceSubmission(Base):
    __tablename__ = "campus_voice_submissions"

    id = Column(Integer, primary_key=True, index=True)
    # Anonymous submissions intentionally have no student_id stored.
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="SET NULL"), nullable=True, index=True)
    is_anonymous = Column(Boolean, nullable=False, default=True)
    submission_type = Column(String(40), nullable=False, default="Feedback")
    category = Column(String(100), nullable=True)
    title = Column(String(180), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(30), nullable=False, default="Pending", index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now, index=True)


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(180), nullable=False)
    category = Column(String(100), nullable=True, index=True)
    description = Column(Text, nullable=True)
    url = Column(String(1000), nullable=True)
    is_published = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)


class SavedResource(Base):
    __tablename__ = "saved_resources"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    saved_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)


class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    counsellor_id = Column(Integer, ForeignKey("counsellor_profiles.id"), nullable=False, index=True)
    title = Column(String(180), nullable=False)
    intervention_type = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="Active", index=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)


class FollowUp(Base):
    __tablename__ = "follow_ups"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    counsellor_id = Column(Integer, ForeignKey("counsellor_profiles.id"), nullable=False, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True)
    due_at = Column(DateTime(timezone=True), nullable=False, index=True)
    mode = Column(String(30), nullable=True)
    status = Column(String(30), nullable=False, default="Scheduled", index=True)
    notes = Column(Text, nullable=True)
    outcome = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)


class OutcomeRecord(Base):
    __tablename__ = "outcome_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    counsellor_id = Column(Integer, ForeignKey("counsellor_profiles.id"), nullable=False, index=True)
    intervention_id = Column(Integer, ForeignKey("interventions.id", ondelete="SET NULL"), nullable=True)
    initial_assessment = Column(Integer, nullable=True)
    latest_assessment = Column(Integer, nullable=True)
    goals_done = Column(Integer, nullable=False, default=0)
    goals_total = Column(Integer, nullable=False, default=0)
    intervention_type = Column(String(100), nullable=True)
    outcome_status = Column(String(40), nullable=False, default="In Progress")
    evaluation_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(180), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=True)
    target_url = Column(String(500), nullable=True)
    is_read = Column(Boolean, nullable=False, default=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    user = relationship("User", back_populates="notifications")
