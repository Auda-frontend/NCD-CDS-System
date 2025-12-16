from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from database.models.prescription import PrescriptionStatus, PrescriptionSource


class PrescriptionBase(BaseModel):
    visit_id: str = Field(..., description="Visit UUID")
    medication: str
    dose: Optional[str] = None
    frequency: Optional[str] = None
    duration_days: Optional[int] = None
    duration: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[PrescriptionStatus] = PrescriptionStatus.DRAFT
    source: Optional[PrescriptionSource] = PrescriptionSource.MANUAL
    reason: Optional[str] = None


class PrescriptionCreate(PrescriptionBase):
    pass


class PrescriptionUpdate(BaseModel):
    medication: Optional[str] = None
    dose: Optional[str] = None
    frequency: Optional[str] = None
    duration_days: Optional[int] = None
    duration: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[PrescriptionStatus] = None
    source: Optional[PrescriptionSource] = None
    reason: Optional[str] = None


class PrescriptionOut(PrescriptionBase):
    id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PrescriptionBulkItem(BaseModel):
    visit_id: str = Field(..., description="Visit UUID")
    medication: str
    dose: Optional[str] = None
    frequency: Optional[str] = None
    duration_days: Optional[int] = None
    duration: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[PrescriptionStatus] = PrescriptionStatus.DRAFT
    source: Optional[PrescriptionSource] = PrescriptionSource.MANUAL
    reason: Optional[str] = None
    recommendation_id: Optional[str] = Field(None, description="Optional CDS recommendation ID")


class PrescriptionBulkCreate(BaseModel):
    prescriptions: List[PrescriptionBulkItem]

