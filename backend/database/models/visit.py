# backend/database/models/visit.py
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Float, Text, JSON, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from . import Base

def gen_uuid():
    return str(uuid.uuid4())

class Visit(Base):
    __tablename__ = "visits"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    patient_id = Column(UUID(as_uuid=False), ForeignKey("patients.id"), index=True, nullable=False)
    visit_date = Column(DateTime(timezone=True), server_default=func.now())
    clinician = Column(String, nullable=True)
    reason = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    # vitals snapshot
    systole = Column(Integer, nullable=True)
    diastole = Column(Integer, nullable=True)
    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True)

    # Drools output
    clinical_decisions = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    patient = relationship("Patient", back_populates="visits")
    tests = relationship("TestResult", back_populates="visit", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="visit", cascade="all, delete-orphan")
