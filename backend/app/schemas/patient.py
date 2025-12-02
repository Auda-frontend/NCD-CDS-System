from pydantic import BaseModel, EmailStr
from typing import Optional

class PatientBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(PatientBase):
    pass

class PatientOut(PatientBase):
    patient_id: int

    class Config:
        orm_mode = True
