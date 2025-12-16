# backend/database/models/prescription.py
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from . import Base
from sqlalchemy.sql import func
import enum

def gen_uuid():
    return str(uuid.uuid4())

class PrescriptionStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    APPROVED = "APPROVED"
    DISPENSED = "DISPENSED"
    CANCELLED = "CANCELLED"


class PrescriptionSource(str, enum.Enum):
    AI_CDS = "AI_CDS"
    MANUAL = "MANUAL"


class Prescription(Base):
    __tablename__ = "prescriptions"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    visit_id = Column(UUID(as_uuid=False), ForeignKey("visits.id"), nullable=False, index=True)
    medication = Column(String, nullable=False)
    dose = Column(String, nullable=True)
    frequency = Column(String, nullable=True)
    duration_days = Column(Integer, nullable=True)
    duration = Column(String, nullable=True)  # e.g., "30 days" free text
    notes = Column(Text, nullable=True)
    status = Column(Enum(PrescriptionStatus), default=PrescriptionStatus.DRAFT, nullable=False)
    source = Column(Enum(PrescriptionSource), default=PrescriptionSource.MANUAL, nullable=False)
    reason = Column(Text, nullable=True)  # why prescribed / CDS rationale
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    visit = relationship("Visit", back_populates="prescriptions")
