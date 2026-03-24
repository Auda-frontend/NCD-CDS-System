from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class AIExplanationSchema(BaseModel):
    """One AI explanation (summary + full for clinician and patient)."""
    clinician_summary: Optional[str] = None
    clinician_explanation: Optional[str] = None
    patient_summary: Optional[str] = None
    patient_explanation: Optional[str] = None
    sources: List[str] = []


class RecommendationMedication(BaseModel):
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    reason: Optional[str] = None


class RecommendationTest(BaseModel):
    test_name: str
    reason: Optional[str] = None


class CDSRecommendationBase(BaseModel):
    visit_id: str = Field(..., description="Visit UUID")
    patient_id: str = Field(..., description="Patient UUID")
    recommended_medications: Optional[List[RecommendationMedication]] = None
    recommended_tests: Optional[List[RecommendationTest]] = None
    risk_classification: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = None  # e.g., drools version
    decisions: Optional[List[Dict[str, Any]]] = None  # original Drools decision objects
    explanations: Optional[List[Optional[Dict[str, Any]]]] = None  # AI explanations per decision


class CDSRecommendationCreate(CDSRecommendationBase):
    pass


class CDSRecommendationOut(CDSRecommendationBase):
    id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

