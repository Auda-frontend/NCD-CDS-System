from sqlalchemy import Column, DateTime, ForeignKey, JSON, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from . import Base


def gen_uuid():
    return str(uuid.uuid4())


class CDSRecommendation(Base):
    __tablename__ = "cds_recommendations"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    visit_id = Column(UUID(as_uuid=False), ForeignKey("visits.id"), nullable=False, index=True)
    patient_id = Column(UUID(as_uuid=False), ForeignKey("patients.id"), nullable=False, index=True)
    recommended_medications = Column(JSON, nullable=True)  # list of {name,dosage,frequency,reason}
    recommended_tests = Column(JSON, nullable=True)  # list of {test_name,reason}
    risk_classification = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    source = Column(String, nullable=True)  # e.g., drools version or rule set
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    visit = relationship("Visit", back_populates="cds_recommendation", foreign_keys=[visit_id])
    patient = relationship("Patient", back_populates="recommendations", foreign_keys=[patient_id])

