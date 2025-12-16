from fastapi import APIRouter, Depends, HTTPException, status, Response
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from ..schemas.patient import PatientCreate, PatientUpdate, PatientOut
from ..schemas.visit import VisitOut
from ..crud import patient as patient_crud
from ..crud import visit as visit_crud
from database.session import get_db
from datetime import date

router = APIRouter(
    tags=["Patients"]
)

# Create patient
@router.post("/", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
async def create_patient(patient: PatientCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await patient_crud.create_patient(db, patient)
    except IntegrityError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Patient with that identifier already exists")

# Get all patients
@router.get("/", response_model=List[PatientOut])
async def read_patients(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await patient_crud.get_patients(db, skip=skip, limit=limit)

# Get single patient
@router.get("/{patient_id}", response_model=PatientOut)
async def get_patient(patient_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single patient by ID"""
    patient = await patient_crud.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

# Get patient demographics
@router.get("/{patient_id}/demographics")
async def get_patient_demographics(patient_id: str, db: AsyncSession = Depends(get_db)):
    """Get patient demographics for auto-filling visit forms"""
    patient = await patient_crud.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Calculate age
    age = None
    if patient.date_of_birth:
        today = date.today()
        age = today.year - patient.date_of_birth.year - ((today.month, today.day) < (patient.date_of_birth.month, patient.date_of_birth.day))
    
    # Only return fields that exist in the Patient model
    return {
        "patient_id": patient.patient_id,
        "full_name": patient.full_name,
        "gender": patient.gender,
        "age": age,
        "phone": patient.phone,
        "date_of_birth": patient.date_of_birth
    }

# Update patient
@router.put("/{patient_id}", response_model=PatientOut)
async def update_patient(patient_id: str, patient: PatientUpdate, db: AsyncSession = Depends(get_db)):
    existing_patient = await patient_crud.get_patient(db, patient_id)
    if not existing_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return await patient_crud.update_patient(db, patient_id, patient)

# Delete patient
@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(patient_id: str, db: AsyncSession = Depends(get_db)):
    existing_patient = await patient_crud.get_patient(db, patient_id)
    if not existing_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    await patient_crud.delete_patient(db, patient_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# Get all visits for a specific patient
@router.get("/{patient_id}/visits", response_model=List[VisitOut])
async def read_patient_visits(
    patient_id: str,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    # Verify patient exists
    patient = await patient_crud.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    visits = await visit_crud.get_visits_by_patient(db, patient_id, skip=skip, limit=limit)
    return visits
