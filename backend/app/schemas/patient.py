from pydantic import BaseModel, field_validator
from typing import Optional, Union
from datetime import datetime, date


class PatientBase(BaseModel):
    patient_id: Optional[str] = None
    full_name: str
    gender: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None

    @field_validator('date_of_birth', mode='before')
    @classmethod
    def parse_date_of_birth(cls, v):
        """Parse date string to datetime object"""
        if v is None or v == '':
            return None
        if isinstance(v, str):
            # Try parsing as date string (YYYY-MM-DD)
            try:
                # Parse as date first, then convert to datetime at midnight
                parsed_date = datetime.strptime(v, '%Y-%m-%d')
                return parsed_date
            except ValueError:
                # If that fails, try parsing as datetime string
                try:
                    return datetime.fromisoformat(v.replace('Z', '+00:00'))
                except ValueError:
                    raise ValueError(f"Invalid date format: {v}. Expected YYYY-MM-DD or ISO datetime format.")
        if isinstance(v, date) and not isinstance(v, datetime):
            # Convert date to datetime at midnight
            return datetime.combine(v, datetime.min.time())
        return v


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    patient_id: Optional[str] = None

    @field_validator('date_of_birth', mode='before')
    @classmethod
    def parse_date_of_birth(cls, v):
        """Parse date string to datetime object"""
        if v is None or v == '':
            return None
        if isinstance(v, str):
            # Try parsing as date string (YYYY-MM-DD)
            try:
                # Parse as date first, then convert to datetime at midnight
                parsed_date = datetime.strptime(v, '%Y-%m-%d')
                return parsed_date
            except ValueError:
                # If that fails, try parsing as datetime string
                try:
                    return datetime.fromisoformat(v.replace('Z', '+00:00'))
                except ValueError:
                    raise ValueError(f"Invalid date format: {v}. Expected YYYY-MM-DD or ISO datetime format.")
        if isinstance(v, date) and not isinstance(v, datetime):
            # Convert date to datetime at midnight
            return datetime.combine(v, datetime.min.time())
        return v


class PatientOut(PatientBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
