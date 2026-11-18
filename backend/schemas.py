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


from datetime import datetime


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
