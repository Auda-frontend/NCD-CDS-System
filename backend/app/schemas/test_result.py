from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from database.models.test_result import TestStatus


class TestResultBase(BaseModel):
    visit_id: str = Field(..., description="Visit UUID")
    type: str
    value: Optional[str] = None
    unit: Optional[str] = None
    status: Optional[TestStatus] = TestStatus.PENDING
    observed_at: Optional[datetime] = None
    reference_range: Optional[str] = None
    code: Optional[str] = None
    notes: Optional[str] = None
    investigation_data: Optional[dict] = None


class TestResultCreate(TestResultBase):
    pass


class TestResultUpdate(BaseModel):
    type: Optional[str] = None
    value: Optional[str] = None
    unit: Optional[str] = None
    status: Optional[TestStatus] = None
    observed_at: Optional[datetime] = None
    reference_range: Optional[str] = None
    code: Optional[str] = None
    notes: Optional[str] = None


class TestResultOut(TestResultBase):
    id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TestResultBulkItem(BaseModel):
    visit_id: str = Field(..., description="Visit UUID")
    type: str
    value: Optional[str] = None
    unit: Optional[str] = None
    status: Optional[TestStatus] = TestStatus.PENDING
    observed_at: Optional[datetime] = None
    reference_range: Optional[str] = None
    code: Optional[str] = None
    notes: Optional[str] = None
    investigation_data: Optional[dict] = None
    recommendation_id: Optional[str] = Field(None, description="Optional CDS recommendation ID")


class TestResultBulkCreate(BaseModel):
    tests: List[TestResultBulkItem]

