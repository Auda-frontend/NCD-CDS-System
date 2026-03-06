# database/models/__init__.py
from sqlalchemy.orm import declarative_base

Base = declarative_base()

from .patient           import Patient
from .visit             import Visit
from .appointment       import Appointment, AppointmentStatus
from .test_result       import TestResult, TestStatus
from .prescription      import Prescription, PrescriptionStatus, PrescriptionSource
from .cds_recommendation import CDSRecommendation

__all__ = [
    "Base",
    "Patient",
    "Visit",
    "Appointment", "AppointmentStatus",
    "TestResult", "TestStatus",
    "Prescription", "PrescriptionStatus", "PrescriptionSource",
    "CDSRecommendation",
]