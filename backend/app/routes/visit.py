from fastapi import APIRouter, Depends, HTTPException, status, Response
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from ..schemas.visit import VisitCreate, VisitUpdate, VisitOut
from ..crud import visit as visit_crud
from ..crud import patient as patient_crud
from ..crud import test_result as test_crud
from ..services.drools_integration import DroolsIntegrationService
from ..services import cds_recommendation_service
from ..models import patient_models
from database.models import Visit
from database.session import get_db
from datetime import datetime, date
from sqlalchemy import update as sa_update

router = APIRouter(
    tags=["Visits"]
)

# Initialize Drools service once
drools_service = DroolsIntegrationService()

# Create visit
@router.post("/", response_model=VisitOut, status_code=status.HTTP_201_CREATED)
async def create_visit(visit: VisitCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await visit_crud.create_visit(db, visit)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Visit could not be created due to integrity constraint violation"
        )


# Get all visits
@router.get("/", response_model=List[VisitOut])
async def read_visits(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    return await visit_crud.get_visits(db, skip=skip, limit=limit)


# Get single visit
@router.get("/{visit_id}", response_model=VisitOut)
async def read_visit(visit_id: str, db: AsyncSession = Depends(get_db)):
    visit = await visit_crud.get_visit(db, visit_id)
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    return visit


# Update visit
@router.put("/{visit_id}", response_model=VisitOut)
async def update_visit(
    visit_id: str,
    visit: VisitUpdate,
    db: AsyncSession = Depends(get_db)
):
    existing_visit = await visit_crud.get_visit(db, visit_id)
    if not existing_visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    try:
        return await visit_crud.update_visit(db, visit_id, visit)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# Delete visit
@router.delete("/{visit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_visit(visit_id: str, db: AsyncSession = Depends(get_db)):
    existing_visit = await visit_crud.get_visit(db, visit_id)
    if not existing_visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    try:
        await visit_crud.delete_visit(db, visit_id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


def _safe_gender(g: str):
    try:
        return patient_models.Gender(g) if g else patient_models.Gender.OTHER
    except Exception:
        return patient_models.Gender.OTHER


def _calculate_age(dob: date | None) -> int | None:
    if not dob:
        return None
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _dict_from_decisions(decisions):
    out = []
    for d in decisions or []:
        try:
            out.append(d.dict())
        except Exception:
            out.append(d)
    return out


async def _assemble_patient_data(db: AsyncSession, visit_obj):
    patient = await patient_crud.get_patient(db, visit_obj.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found for visit")

    # Demographics
    age_val = _calculate_age(patient.date_of_birth)
    demographics = patient_models.PatientDemographics(
        patient_id=patient.patient_id,
        full_name=patient.full_name,
        gender=_safe_gender(patient.gender),
        age=age_val if age_val is not None else 0,
    )

    # Consultation
    consultation_payload = visit_obj.consultation or {}
    if visit_obj.chief_complaint and "chief_complaint" not in consultation_payload:
        consultation_payload["chief_complaint"] = visit_obj.chief_complaint
    consultation = patient_models.Consultation(**consultation_payload)

    # Medical history / social history
    medical_history = patient_models.MedicalHistory(**(visit_obj.medical_history or {}))
    social_history = patient_models.SocialHistory(**(visit_obj.social_history or {}))

    # Physical examination
    phys_payload = visit_obj.physical_examination or {}
    phys_payload.setdefault("systole", visit_obj.systole or 0)
    phys_payload.setdefault("diastole", visit_obj.diastole or 0)
    phys_payload.setdefault("height", visit_obj.height_cm)
    phys_payload.setdefault("weight", visit_obj.weight_kg)
    phys_payload.setdefault("bmi", visit_obj.bmi)
    phys_payload.setdefault("pulse", visit_obj.pulse)
    phys_payload.setdefault("temperature", visit_obj.temperature)
    phys_payload.setdefault("spO2", visit_obj.spo2)
    phys_payload.setdefault("pain_score", visit_obj.pain_score)
    physical_examination = patient_models.PhysicalExamination(**phys_payload)

    # Investigations: prefer visit.investigations, else latest test_result.investigation_data
    investigations_payload = visit_obj.investigations or {}
    if not investigations_payload:
        tests = await test_crud.get_tests_by_visit(db, visit_obj.id, limit=1)
        if tests:
            investigations_payload = tests[0].investigation_data or {}
    investigations = None
    if investigations_payload:
        investigations = patient_models.Investigations(**investigations_payload)

    return patient_models.PatientData(
        demographics=demographics,
        consultation=consultation,
        medical_history=medical_history,
        social_history=social_history,
        physical_examination=physical_examination,
        investigations=investigations,
    )


@router.post("/{visit_id}/cds-evaluate", response_model=dict)
async def evaluate_visit_cds(visit_id: str, db: AsyncSession = Depends(get_db)):
    visit_obj = await visit_crud.get_visit(db, visit_id)
    if not visit_obj:
        raise HTTPException(status_code=404, detail="Visit not found")

    patient_data = await _assemble_patient_data(db, visit_obj)

    response = drools_service.evaluate_patient(patient_data)
    decisions = _dict_from_decisions(response.clinical_decisions)

    # Persist decisions and recommendation
    await db.execute(
        sa_update(type(visit_obj))
        .where(type(visit_obj).id == visit_obj.id)
        .values(clinical_decisions=decisions)
    )
    await db.commit()

    recommendation = await cds_recommendation_service.save_recommendations(
        db,
        patient_id=visit_obj.patient_id,
        visit_id=visit_obj.id,
        decisions=decisions,
        risk_classification=None,
        notes=response.message,
        source="drools",
    )

    return {
        "success": response.success,
        "message": response.message,
        "execution_time_ms": response.execution_time_ms,
        "clinical_decisions": decisions,
        "recommendation_id": recommendation.id,
        "visit_id": str(visit_obj.id),
        "patient_id": str(visit_obj.patient_id),
    }
