# backend/database/models/test_result.py
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from . import Base
from sqlalchemy.sql import func

def gen_uuid():
    return str(uuid.uuid4())

class TestResult(Base):
    __tablename__ = "test_results"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    visit_id = Column(UUID(as_uuid=False), ForeignKey("visits.id"), nullable=False, index=True)
    type = Column(String, nullable=False)
    value = Column(String, nullable=False)
    unit = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    visit = relationship("Visit", back_populates="tests")
