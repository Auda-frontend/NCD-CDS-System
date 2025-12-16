from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
import time
from ..models.patient_models import (
    CDSRequest, CDSResponse, PatientData, HealthCheck
)
from ..services.drools_integration import DroolsIntegrationService
from database.session import get_db

router = APIRouter(prefix="/api/v1/cds", tags=["Clinical Decision Support"])

# Initialize the Drools service
drools_service = DroolsIntegrationService()

@router.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint"""
    return HealthCheck(
        status="healthy",
        timestamp=time.strftime("%Y-%m-%d %H:%M:%S")
    )

@router.post("/evaluate", response_model=CDSResponse)
async def evaluate_patient(request: CDSRequest, db: AsyncSession = Depends(get_db)):
    """
    Evaluate patient data and provide clinical decision support
    for hypertension management based on Rwanda guidelines.
    Saves recommendations to database.
    """
    try:
        response = drools_service.evaluate_patient(request.patient_data)
        
        # Save recommendations to database
        from ..services import cds_recommendation_service
        await cds_recommendation_service.save_recommendations(
            db=db,
            patient_id=request.patient_data.demographics.patient_id,
            visit_id=request.visit_id,
            decisions=response.clinical_decisions or [],
            risk_classification=response.risk_classification,
            notes="Manual CDS evaluation",
            source="DROOLS"
        )
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evaluate-direct", response_model=CDSResponse)
async def evaluate_patient_direct(patient_data: PatientData):
    """
    Evaluate patient data directly (without nested patient_data field)
    """
    try:
        response = drools_service.evaluate_patient(patient_data)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))