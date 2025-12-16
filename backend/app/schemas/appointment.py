from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime, date, time
from database.models.appointment import AppointmentStatus


class AppointmentBase(BaseModel):
    patient_id: str = Field(..., description="Patient UUID")
    visit_id: Optional[str] = Field(None, description="Visit UUID")
    scheduled_at: datetime
    status: Optional[AppointmentStatus] = AppointmentStatus.SCHEDULED
    missed_count: Optional[int] = 0
    reason: Optional[str] = None

    @field_validator("scheduled_at", mode="before")
    @classmethod
    def parse_scheduled_at(cls, v):
        """
        Accept date-only strings (YYYY-MM-DD) or datetime strings (YYYY-MM-DDTHH:MM).
        """
        if v is None or v == "":
            return None
        if isinstance(v, datetime):
            return v
        if isinstance(v, date) and not isinstance(v, datetime):
            return datetime.combine(v, time.min)
        if isinstance(v, str):
            # Try date only
            try:
                return datetime.strptime(v, "%Y-%m-%d")
            except ValueError:
                pass
            # Try datetime without seconds
            try:
                return datetime.strptime(v, "%Y-%m-%dT%H:%M")
            except ValueError:
                pass
            # Fallback to ISO
            try:
                return datetime.fromisoformat(v.replace("Z", "+00:00"))
            except ValueError:
                raise ValueError("Invalid scheduled_at format. Use YYYY-MM-DD or YYYY-MM-DDTHH:MM")
        return v


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    status: Optional[AppointmentStatus] = None
    missed_count: Optional[int] = None
    reason: Optional[str] = None


class AppointmentOut(AppointmentBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    follow_up_state: Optional[str] = None

    class Config:
        from_attributes = True

