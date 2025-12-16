from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, List
from datetime import datetime, date


class VisitBase(BaseModel):
    patient_id: str = Field(..., description="Patient UUID")
    visit_date: Optional[datetime] = None
    clinician: Optional[str] = None
    reason: Optional[str] = None
    chief_complaint: Optional[str] = None
    complaints: Optional[str] = None
    symptoms: Optional[Dict[str, Any]] = None
    consultation: Optional[Dict[str, Any]] = None
    medical_history: Optional[Dict[str, Any]] = None
    social_history: Optional[Dict[str, Any]] = None
    physical_examination: Optional[Dict[str, Any]] = None
    investigations: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    
    # Vitals snapshot
    systole: Optional[int] = Field(None, ge=0, le=300, description="Systolic blood pressure in mmHg")
    diastole: Optional[int] = Field(None, ge=0, le=200, description="Diastolic blood pressure in mmHg")
    weight_kg: Optional[float] = Field(None, ge=0, le=500, description="Weight in kilograms")
    height_cm: Optional[float] = Field(None, ge=0, le=300, description="Height in centimeters")
    bmi: Optional[float] = Field(None, ge=0, le=100, description="Body Mass Index")
    pulse: Optional[float] = Field(None, ge=0, le=300, description="Pulse rate in BPM")
    temperature: Optional[float] = Field(None, ge=20, le=45, description="Temperature in Celsius")
    spo2: Optional[float] = Field(None, ge=0, le=100, description="Oxygen saturation percentage")
    pain_score: Optional[int] = Field(None, ge=0, le=10, description="Pain score from 0-10")
    # Drools output
    # Drools output is a list of decision objects; store as a list
    clinical_decisions: Optional[List[Dict[str, Any]]] = None

    @field_validator("visit_date", mode="before")
    @classmethod
    def parse_visit_date(cls, v):
        """
        Accept either full datetime or simple date strings (YYYY-MM-DD) from the UI.
        """
        if v is None or v == "":
            return None
        if isinstance(v, datetime):
            return v
        if isinstance(v, date):
            return datetime.combine(v, datetime.min.time())
        if isinstance(v, str):
            # Allow plain date
            try:
                return datetime.strptime(v, "%Y-%m-%d")
            except ValueError:
                pass
            # Fallback to ISO parsing (will raise if invalid)
            try:
                return datetime.fromisoformat(v.replace("Z", "+00:00"))
            except ValueError:
                raise ValueError("Invalid visit_date format. Use YYYY-MM-DD or ISO datetime.")
        return v


class VisitCreate(VisitBase):
    pass


class VisitUpdate(BaseModel):
    visit_date: Optional[datetime] = None
    clinician: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    
    # Vitals snapshot
    systole: Optional[int] = Field(None, ge=0, le=300)
    diastole: Optional[int] = Field(None, ge=0, le=200)
    weight_kg: Optional[float] = Field(None, ge=0, le=500)
    height_cm: Optional[float] = Field(None, ge=0, le=300)
    bmi: Optional[float] = Field(None, ge=0, le=100)
    
    # Drools output
    clinical_decisions: Optional[Dict[str, Any]] = None


class VisitOut(VisitBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
