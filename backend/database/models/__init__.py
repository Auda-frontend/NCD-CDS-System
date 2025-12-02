# backend/database/models/__init__.py
from sqlalchemy.orm import declarative_base

# Base for all models
Base = declarative_base()

# import models so Alembic can detect them
from .patient import Patient
from .visit import Visit
from .appointment import Appointment
from .test_result import TestResult
from .prescription import Prescription
