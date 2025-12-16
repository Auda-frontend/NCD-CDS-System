from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

class Gender(str, Enum):
    MALE = "Male"
    FEMALE = "Female"
    OTHER = "Other"

class ConsultationType(str, Enum):
    INITIAL = "initial"
    FOLLOW_UP = "follow-up"
    EMERGENCY = "emergency"

class DiabetesOnset(str, Enum):
    ACUTE = "acute"
    GRADUAL = "gradual"

class PatientDemographics(BaseModel):
    patient_id: Optional[str] = None
    upid: Optional[str] = None
    full_name: str
    gender: Gender
    age: int = Field(None, ge=0, le=120)
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
    
    # Diabetes-specific fields
    diabetes_symptoms: bool = False
    diabetes_onset: Optional[DiabetesOnset] = None
    ketoacidosis_history: bool = False
    autoimmune_disease: bool = False
    obesity: bool = False
    family_history_diabetes: bool = False
    history_gdm: bool = False
    renal_impairment: bool = False
    liver_disease: bool = False
    cardiovascular_disease: bool = False
    neuropathy_symptoms: bool = False
    persistent_proteinuria: bool = False
    cardiovascular_risk_factors: bool = False
    abdominal_pain: bool = False
    nausea_vomiting: bool = False
    dehydration: bool = False
    rapid_breathing: bool = False
    danger_signs: bool = False
    treatment_duration: Optional[int] = Field(None, ge=0, description="Treatment duration in months")
    hiv_positive: bool = False

class SocialHistory(BaseModel):
    tobacco_use: bool = False
    alcohol_use: bool = False

class PhysicalExamination(BaseModel):
    systole: float = Field(..., ge=0, le=300, description="Systolic blood pressure in mmHg")
    diastole: float = Field(..., ge=0, le=200, description="Diastolic blood pressure in mmHg")
    bp_status: Optional[str] = None
    height: Optional[float] = Field(None, ge=0, le=300, description="Height in centimeters")
    weight: float = Field(None, ge=0, le=500, description="Weight in kilograms")
    bmi: Optional[float] = Field(None, ge=0, le=100, description="Body Mass Index")
    bmi_status: Optional[str] = None
    pulse: Optional[float] = Field(None, ge=0, le=300, description="Pulse rate in BPM")
    temperature: Optional[float] = Field(None, ge=20, le=45, description="Temperature in Celsius")
    spO2: Optional[float] = Field(None, ge=0, le=100, description="Oxygen saturation percentage")
    pain_score: Optional[int] = Field(None, ge=0, le=10, description="Pain score from 0-10")

class Investigations(BaseModel):
    hba1c: Optional[float] = Field(None, ge=0, le=20, description="Glycated hemoglobin percentage")
    fasting_glucose: Optional[float] = Field(None, ge=0, le=50, description="Fasting blood glucose in mmol/L")
    random_glucose: Optional[float] = Field(None, ge=0, le=50, description="Random blood glucose in mmol/L")
    blood_glucose: Optional[float] = Field(None, ge=0, le=50, description="Blood glucose in mmol/L")
    egfr: Optional[float] = Field(None, ge=0, le=200, description="Estimated glomerular filtration rate")
    ketonuria: Optional[bool] = None
    urine_protein: Optional[float] = Field(None, ge=0, description="Urine protein level")
    serum_creatinine: float = Field(None, ge=0, description="Serum creatinine level")
    ldl_cholesterol: Optional[float] = Field(None, ge=0, description="LDL cholesterol level")
    additional_tests: List[str] = []

class ClinicalDecision(BaseModel):
    diagnosis: Optional[str] = None
    stage: Optional[str] = None
    sub_classification: Optional[str] = None  # Added for diabetes type
    medications: List[str] = []  # Changed from recommended_medications
    tests: List[str] = []  # Changed from recommended_tests
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
    investigations: Optional[Investigations] = None  # Added for diabetes

class CDSRequest(BaseModel):
    patient_data: PatientData
    visit_id: str  # UUID of the visit for linking recommendations

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

# Example usage and helper functions
def create_sample_diabetes_patient() -> PatientData:
    """Create a sample diabetes patient for testing"""
    return PatientData(
        demographics=PatientDemographics(
            full_name="Diabetes Test Patient",
            gender=Gender.FEMALE,
            age=52
        ),
        consultation=Consultation(
            chief_complaint="Increased thirst and frequent urination"
        ),
        medical_history=MedicalHistory(
            diabetes=True,
            diabetes_symptoms=True,
            diabetes_onset=DiabetesOnset.GRADUAL,
            obesity=True,
            family_history_diabetes=True,
            hypertension=False
        ),
        social_history=SocialHistory(),
        physical_examination=PhysicalExamination(
            systole=125.0,
            diastole=82.0,
            bmi=31.2,
            bmi_status="Obese"
        ),
        investigations=Investigations(
            hba1c=9.2,
            fasting_glucose=10.5,
            random_glucose=16.8,
            egfr=85.0
        )
    )

def create_sample_hypertension_patient() -> PatientData:
    """Create a sample hypertension patient for testing"""
    return PatientData(
        demographics=PatientDemographics(
            full_name="Hypertension Test Patient",
            gender=Gender.MALE,
            age=45
        ),
        consultation=Consultation(
            chief_complaint="Headache and dizziness"
        ),
        medical_history=MedicalHistory(
            hypertension=True,
            overweight=True
        ),
        social_history=SocialHistory(
            tobacco_use=True
        ),
        physical_examination=PhysicalExamination(
            systole=165.0,
            diastole=102.0
        ),
        investigations=Investigations()
    )

def patient_to_dict(patient_data: PatientData) -> Dict[str, Any]:
    """Convert patient data to dictionary for JSON serialization"""
    return patient_data.dict()

def dict_to_patient(data: Dict[str, Any]) -> PatientData:
    """Convert dictionary to PatientData object"""
    return PatientData(**data)