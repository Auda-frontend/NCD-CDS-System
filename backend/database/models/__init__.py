# backend/database/models/__init__.py
from sqlalchemy.orm import declarative_base

# Base for all models
Base = declarative_base()

# import models so Alembic can detect them
from .patient import Patient
from .visit import Visit
from .appointment import Appointment
from .test_result import TestResult, TestStatus
from .prescription import Prescription, PrescriptionStatus, PrescriptionSource
from .appointment import Appointment, AppointmentStatus
from .cds_recommendation import CDSRecommendation
from .cds_recommendation import CDSRecommendation
