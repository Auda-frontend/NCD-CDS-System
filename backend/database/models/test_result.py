# backend/database/models/test_result.py
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from . import Base
from sqlalchemy.sql import func
import enum

def gen_uuid():
    return str(uuid.uuid4())

class TestStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class TestResult(Base):
    __tablename__ = "test_results"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    visit_id = Column(UUID(as_uuid=False), ForeignKey("visits.id"), nullable=False, index=True)
    type = Column(String, nullable=False)
    value = Column(String, nullable=False)
    unit = Column(String, nullable=True)
    status = Column(Enum(TestStatus), default=TestStatus.PENDING, nullable=False)
    observed_at = Column(DateTime(timezone=True), nullable=True)
    reference_range = Column(String, nullable=True)
    code = Column(String, nullable=True)  # e.g., LOINC code string
    notes = Column(Text, nullable=True)
    investigation_data = Column(JSON, nullable=True)  # structured payload matching Investigations model
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    visit = relationship("Visit", back_populates="tests")
