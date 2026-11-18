from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class StudentRegister(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    student_number: str | None = Field(default=None, max_length=50)
    department: str | None = Field(default=None, max_length=120)
    course: str | None = Field(default=None, max_length=120)
    year_of_study: int | None = Field(default=None, ge=1, le=10)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    role: str
    is_active: bool


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse



class AppointmentCreate(BaseModel):
    counsellor_id: int = Field(gt=0)
    scheduled_at: datetime
    mode: str = Field(default="In-person", max_length=30)
    reason: str = Field(min_length=2, max_length=120)
    message: str | None = Field(default=None, max_length=3000)


class AppointmentStatusUpdate(BaseModel):
    status: str = Field(pattern="^(Confirmed|Declined|Completed|Cancelled)$")


class AppointmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    counsellor_id: int
    scheduled_at: datetime
    duration_minutes: int
    mode: str
    reason: str
    message: str | None
    status: str


class WellnessCheckinCreate(BaseModel):
    mood: str | None = Field(default=None, max_length=60)
    sleep_hours: float | None = Field(default=None, ge=0, le=24)
    energy_level: str | None = Field(default=None, max_length=40)
    stress_level: str | None = Field(default=None, max_length=40)
    score: int | None = Field(default=None, ge=0, le=100)
    notes: str | None = Field(default=None, max_length=3000)


class WellnessCheckinResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    mood: str | None
    sleep_hours: float | None
    energy_level: str | None
    stress_level: str | None
    score: int | None
    notes: str | None
    submitted_at: datetime


class SupportRequestCreate(BaseModel):
    category: str = Field(min_length=2, max_length=100)
    title: str = Field(min_length=2, max_length=180)
    message: str = Field(min_length=5, max_length=5000)
    priority: str = Field(default="Normal", pattern="^(Low|Normal|High|Urgent)$")


class SupportRequestUpdate(BaseModel):
    status: str | None = Field(default=None, pattern="^(Open|In Progress|Resolved|Closed)$")
    assigned_counsellor_id: int | None = Field(default=None, gt=0)


class SupportRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    assigned_counsellor_id: int | None
    category: str
    priority: str
    title: str
    message: str
    status: str
    created_at: datetime


class CampusVoiceCreate(BaseModel):
    submission_type: str = Field(default="Feedback", pattern="^(Feedback|Complaint|Suggestion)$")
    category: str | None = Field(default=None, max_length=100)
    title: str = Field(min_length=2, max_length=180)
    message: str = Field(min_length=5, max_length=5000)
    is_anonymous: bool = True


class CampusVoiceStatusUpdate(BaseModel):
    status: str = Field(pattern="^(Pending|Under Review|Resolved|Closed)$")


class CampusVoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_anonymous: bool
    submission_type: str
    category: str | None
    title: str
    message: str
    status: str
    created_at: datetime


class ResourceCreate(BaseModel):
    title: str = Field(min_length=2, max_length=180)
    category: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=5000)
    url: str | None = Field(default=None, max_length=1000)
    is_published: bool = True


class ResourceUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=180)
    category: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=5000)
    url: str | None = Field(default=None, max_length=1000)
    is_published: bool | None = None


class ResourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    category: str | None
    description: str | None
    url: str | None
    is_published: bool
    created_at: datetime


class AdminBootstrap(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)


class AdminPasswordReset(BaseModel):
    email: EmailStr
    new_password: str = Field(min_length=12, max_length=128)


class CounsellorCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    employee_id: str | None = Field(default=None, max_length=50)
    specialization: str | None = Field(default=None, max_length=200)
    qualification: str | None = Field(default=None, max_length=200)
    phone: str | None = Field(default=None, max_length=30)
    is_available: bool = True


class CounsellorProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=150)
    specialization: str | None = Field(default=None, max_length=200)
    qualification: str | None = Field(default=None, max_length=200)
    phone: str | None = Field(default=None, max_length=30)
    is_available: bool | None = None


class CounsellorProfileResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    employee_id: str | None
    specialization: str | None
    qualification: str | None
    phone: str | None
    is_available: bool


class CounsellorStudentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    student_number: str | None
    department: str | None
    course: str | None
    year_of_study: int | None


class FollowUpCreate(BaseModel):
    student_id: int = Field(gt=0)
    appointment_id: int | None = Field(default=None, gt=0)
    due_at: datetime
    mode: str | None = Field(default=None, max_length=30)
    notes: str | None = Field(default=None, max_length=3000)


class FollowUpUpdate(BaseModel):
    due_at: datetime | None = None
    mode: str | None = Field(default=None, max_length=30)
    status: str | None = Field(default=None, pattern="^(Scheduled|Completed|Missed|Cancelled)$")
    notes: str | None = Field(default=None, max_length=3000)
    outcome: str | None = Field(default=None, max_length=3000)


class FollowUpResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    counsellor_id: int
    appointment_id: int | None
    due_at: datetime
    mode: str | None
    status: str
    notes: str | None
    outcome: str | None
    created_at: datetime


class InterventionCreate(BaseModel):
    student_id: int = Field(gt=0)
    title: str = Field(min_length=2, max_length=180)
    intervention_type: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=5000)
    status: str = Field(default="Active", pattern="^(Active|Completed|Paused|Cancelled)$")
    start_date: date | None = None
    end_date: date | None = None


class InterventionUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=180)
    intervention_type: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=5000)
    status: str | None = Field(default=None, pattern="^(Active|Completed|Paused|Cancelled)$")
    start_date: date | None = None
    end_date: date | None = None


class InterventionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    counsellor_id: int
    title: str
    intervention_type: str | None
    description: str | None
    status: str
    start_date: date | None
    end_date: date | None
    created_at: datetime


class OutcomeCreate(BaseModel):
    student_id: int = Field(gt=0)
    intervention_id: int | None = Field(default=None, gt=0)
    initial_assessment: int | None = Field(default=None, ge=0, le=100)
    latest_assessment: int | None = Field(default=None, ge=0, le=100)
    goals_done: int = Field(default=0, ge=0)
    goals_total: int = Field(default=0, ge=0)
    intervention_type: str | None = Field(default=None, max_length=100)
    outcome_status: str = Field(default="In Progress", pattern="^(In Progress|Improving|Stable|Completed|Needs Review)$")
    evaluation_date: date | None = None
    notes: str | None = Field(default=None, max_length=5000)


class OutcomeUpdate(BaseModel):
    initial_assessment: int | None = Field(default=None, ge=0, le=100)
    latest_assessment: int | None = Field(default=None, ge=0, le=100)
    goals_done: int | None = Field(default=None, ge=0)
    goals_total: int | None = Field(default=None, ge=0)
    intervention_type: str | None = Field(default=None, max_length=100)
    outcome_status: str | None = Field(default=None, pattern="^(In Progress|Improving|Stable|Completed|Needs Review)$")
    evaluation_date: date | None = None
    notes: str | None = Field(default=None, max_length=5000)


class OutcomeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    counsellor_id: int
    intervention_id: int | None
    initial_assessment: int | None
    latest_assessment: int | None
    goals_done: int
    goals_total: int
    intervention_type: str | None
    outcome_status: str
    evaluation_date: date | None
    notes: str | None
    created_at: datetime



class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    message: str
    notification_type: str | None
    target_url: str | None
    is_read: bool
    created_at: datetime


class NotificationReadUpdate(BaseModel):
    is_read: bool = True



class AdminAnalyticsOverview(BaseModel):
    total_students: int
    active_students: int
    total_counsellors: int
    available_counsellors: int
    total_appointments: int
    pending_appointments: int
    completed_appointments: int
    total_support_requests: int
    open_support_requests: int
    total_wellness_checkins: int
    total_interventions: int
    active_interventions: int
    total_follow_ups: int
    upcoming_follow_ups: int
    total_resources: int
    total_campus_voice_submissions: int
    appointment_statuses: dict[str, int]
    support_request_statuses: dict[str, int]
    intervention_statuses: dict[str, int]
    monthly_appointments: list[dict[str, int | str]]
    monthly_wellness_checkins: list[dict[str, int | str]]


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=12, max_length=128)
