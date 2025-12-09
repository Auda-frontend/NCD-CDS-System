from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class VisitBase(BaseModel):
    patient_id: str = Field(..., description="Patient UUID")
    visit_date: Optional[datetime] = None
    clinician: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    
    # Vitals snapshot
    systole: Optional[int] = Field(None, ge=0, le=300, description="Systolic blood pressure in mmHg")
    diastole: Optional[int] = Field(None, ge=0, le=200, description="Diastolic blood pressure in mmHg")
    weight_kg: Optional[float] = Field(None, ge=0, le=500, description="Weight in kilograms")
    height_cm: Optional[float] = Field(None, ge=0, le=300, description="Height in centimeters")
    bmi: Optional[float] = Field(None, ge=0, le=100, description="Body Mass Index")
    
    # Drools output
    clinical_decisions: Optional[Dict[str, Any]] = None


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
        orm_mode = True
