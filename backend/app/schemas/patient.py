from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PatientBase(BaseModel):
    patient_id: Optional[str] = None
    full_name: str
    gender: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    patient_id: Optional[str] = None


class PatientOut(PatientBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
