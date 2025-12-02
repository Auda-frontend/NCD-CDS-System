from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from database.session import get_db
from schemas.patient import PatientCreate, PatientUpdate, PatientOut
import crud.patient as patient_crud

router = APIRouter(
    prefix="/patients",
    tags=["Patients"]
)

# Create patient
@router.post("/", response_model=PatientOut)
async def create_patient(patient: PatientCreate, db: AsyncSession = Depends(get_db)):
    return await patient_crud.create_patient(db, patient)

# Get all patients
@router.get("/", response_model=List[PatientOut])
async def read_patients(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await patient_crud.get_patients(db, skip=skip, limit=limit)

# Get single patient
@router.get("/{patient_id}", response_model=PatientOut)
async def read_patient(patient_id: int, db: AsyncSession = Depends(get_db)):
    patient = await patient_crud.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

# Update patient
@router.put("/{patient_id}", response_model=PatientOut)
async def update_patient(patient_id: int, patient: PatientUpdate, db: AsyncSession = Depends(get_db)):
    existing_patient = await patient_crud.get_patient(db, patient_id)
    if not existing_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return await patient_crud.update_patient(db, patient_id, patient)

# Delete patient
@router.delete("/{patient_id}")
async def delete_patient(patient_id: int, db: AsyncSession = Depends(get_db)):
    existing_patient = await patient_crud.get_patient(db, patient_id)
    if not existing_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return await patient_crud.delete_patient(db, patient_id)
