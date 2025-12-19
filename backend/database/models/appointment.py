# backend/database/models/appointment.py
from sqlalchemy import Column, String, DateTime, Integer, Enum, ForeignKey, func, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
import uuid
from . import Base

def gen_uuid():
    return str(uuid.uuid4())

class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    ATTENDED = "ATTENDED"
    MISSED = "MISSED"
    CANCELLED = "CANCELLED"
    RESCHEDULED = "RESCHEDULED"

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    patient_id = Column(UUID(as_uuid=False), ForeignKey("patients.id"), nullable=False, index=True)
    visit_id = Column(UUID(as_uuid=False), ForeignKey("visits.id"), nullable=True, index=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(AppointmentStatus, name="appointmentstatus", create_type=False), default=AppointmentStatus.SCHEDULED)
    missed_count = Column(Integer, default=0)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    patient = relationship("Patient", back_populates="appointments")
    visit = relationship("Visit", back_populates="appointments")

    @property
    def follow_up_state(self) -> str:
        """
        Derived follow-up state:
        - ACTIVE: missed_count == 0
        - LOST_FOLLOW_UP: missed_count in {1,2}
        - DROPOUT: missed_count >= 3
        """
        if self.missed_count is None:
            return "ACTIVE"
        if self.missed_count >= 3:
            return "DROPOUT"
        if self.missed_count >= 1:
            return "LOST_FOLLOW_UP"
        return "ACTIVE"
