from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class Gender(str, Enum):
    MALE = "Male"
    FEMALE = "Female"
    OTHER = "Other"

class ConsultationType(str, Enum):
    INITIAL = "initial"
    FOLLOW_UP = "follow-up"
    EMERGENCY = "emergency"

class PatientDemographics(BaseModel):
    patient_id: Optional[str] = None
    upid: Optional[str] = None
    full_name: str
    gender: Gender
    age: Optional[int] = Field(None, ge=0, le=120)
    province: Optional[str] = None
    district: Optional[str] = None
    sector: Optional[str] = None
    cell: Optional[str] = None
    village: Optional[str] = None

class Consultation(BaseModel):
    practitioner_name: Optional[str] = None
    consultation_type: Optional[ConsultationType] = None
    chief_complaint: Optional[str] = None
    patient_referred_from: Optional[str] = None

class MedicalHistory(BaseModel):
    hypertension: bool = False
    diabetes: bool = False
    chronic_kidney_disease: bool = False
    asthma: bool = False
    copd: bool = False
    tonsilitis: bool = False
    overweight: bool = False
    undernutrition: bool = False
    cad: bool = False
    hyperkalemia: bool = False
    pregnant: bool = False
    stroke_history: bool = False
    heart_failure: bool = False
    current_medications: List[str] = []
    medication_allergies: List[str] = []
    former_smoker: bool = False
    current_smoker: bool = False
    former_alcohol: bool = False
    current_alcohol: bool = False

class SocialHistory(BaseModel):
    tobacco_use: bool = False
    alcohol_use: bool = False

class PhysicalExamination(BaseModel):
    systole: float = Field(..., ge=0, le=300, description="Systolic blood pressure in mmHg")
    diastole: float = Field(..., ge=0, le=200, description="Diastolic blood pressure in mmHg")
    bp_status: Optional[str] = None
    height: Optional[float] = Field(None, ge=0, le=300, description="Height in centimeters")
    weight: Optional[float] = Field(None, ge=0, le=500, description="Weight in kilograms")
    bmi: Optional[float] = Field(None, ge=0, le=100, description="Body Mass Index")
    bmi_status: Optional[str] = None
    pulse: Optional[float] = Field(None, ge=0, le=300, description="Pulse rate in BPM")
    temperature: Optional[float] = Field(None, ge=20, le=45, description="Temperature in Celsius")
    spO2: Optional[float] = Field(None, ge=0, le=100, description="Oxygen saturation percentage")
    pain_score: Optional[int] = Field(None, ge=0, le=10, description="Pain score from 0-10")

class ClinicalDecision(BaseModel):
    diagnosis: Optional[str] = None
    stage: Optional[str] = None
    recommended_medications: List[str] = []
    recommended_tests: List[str] = []
    patient_advice: Optional[str] = None
    needs_referral: bool = False
    referral_reason: Optional[str] = None
    confidence_level: Optional[str] = None

class PatientData(BaseModel):
    demographics: PatientDemographics
    consultation: Consultation
    medical_history: MedicalHistory
    social_history: SocialHistory
    physical_examination: PhysicalExamination

class CDSRequest(BaseModel):
    patient_data: PatientData

class CDSResponse(BaseModel):
    success: bool
    message: str
    clinical_decisions: List[ClinicalDecision]
    patient_data: PatientData
    execution_time_ms: Optional[float] = None

class HealthCheck(BaseModel):
    status: str
    timestamp: str
    version: str = "1.0.0"