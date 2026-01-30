from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from ..schemas.prescription import (
    PrescriptionCreate,
    PrescriptionUpdate,
    PrescriptionOut,
    PrescriptionBulkCreate,
)
from ..crud import prescription as prescription_crud
from database.session import get_db

router = APIRouter(tags=["Prescriptions"])


@router.post("/", response_model=PrescriptionOut, status_code=status.HTTP_201_CREATED)
async def create_prescription(payload: PrescriptionCreate, db: AsyncSession = Depends(get_db)):
    return await prescription_crud.create_prescription(db, payload)


@router.post("/bulk", response_model=List[PrescriptionOut], status_code=status.HTTP_201_CREATED)
async def create_prescriptions_bulk(payload: PrescriptionBulkCreate, db: AsyncSession = Depends(get_db)):
    if not payload.prescriptions:
        raise HTTPException(status_code=400, detail="No prescriptions provided")
    return await prescription_crud.create_prescriptions_bulk(db, payload.prescriptions)


@router.get("/", response_model=List[PrescriptionOut])
async def read_all_prescriptions(skip: int = 0, limit: int = 1000, db: AsyncSession = Depends(get_db)):
    return await prescription_crud.get_all_prescriptions(db, skip=skip, limit=limit)


@router.get("/{prescription_id}", response_model=PrescriptionOut)
async def read_prescription(prescription_id: str, db: AsyncSession = Depends(get_db)):
    obj = await prescription_crud.get_prescription(db, prescription_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return obj


@router.get("/by-visit/{visit_id}", response_model=List[PrescriptionOut])
async def read_prescriptions_by_visit(visit_id: str, skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await prescription_crud.get_prescriptions_by_visit(db, visit_id, skip=skip, limit=limit)


@router.get("/by-patient/{patient_id}", response_model=List[PrescriptionOut])
async def read_prescriptions_by_patient(patient_id: str, skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await prescription_crud.get_prescriptions_by_patient(db, patient_id, skip=skip, limit=limit)


@router.put("/{prescription_id}", response_model=PrescriptionOut)
async def update_prescription(prescription_id: str, payload: PrescriptionUpdate, db: AsyncSession = Depends(get_db)):
    updated = await prescription_crud.update_prescription(db, prescription_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return updated


@router.delete("/{prescription_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prescription(prescription_id: str, db: AsyncSession = Depends(get_db)):
    try:
        await prescription_crud.delete_prescription(db, prescription_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return None

