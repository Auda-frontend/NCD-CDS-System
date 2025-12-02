# backend/database/models/patient.py
from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from . import Base

def gen_uuid():
    return str(uuid.uuid4())

class Patient(Base):
    __tablename__ = "patients"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    patient_id = Column(String, unique=True, index=True, nullable=True)  # external id
    full_name = Column(String, nullable=False)
    gender = Column(String, nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    visits = relationship("Visit", back_populates="patient", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
