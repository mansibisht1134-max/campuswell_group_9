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
