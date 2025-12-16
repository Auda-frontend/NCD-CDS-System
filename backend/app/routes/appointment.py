from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from ..schemas.appointment import (
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentOut,
)
from ..crud import appointment as appointment_crud
from database.session import get_db

router = APIRouter(tags=["Appointments"])


@router.get("/", response_model=List[AppointmentOut])
async def read_appointments(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await appointment_crud.get_appointments(db, skip=skip, limit=limit)


@router.post("/", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
async def create_appointment(payload: AppointmentCreate, db: AsyncSession = Depends(get_db)):
    return await appointment_crud.create_appointment(db, payload)


@router.get("/{appointment_id}", response_model=AppointmentOut)
async def read_appointment(appointment_id: str, db: AsyncSession = Depends(get_db)):
    obj = await appointment_crud.get_appointment(db, appointment_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return obj


@router.get("/by-patient/{patient_id}", response_model=List[AppointmentOut])
async def read_appointments_by_patient(patient_id: str, skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await appointment_crud.get_appointments_by_patient(db, patient_id, skip=skip, limit=limit)


@router.put("/{appointment_id}", response_model=AppointmentOut)
async def update_appointment(appointment_id: str, payload: AppointmentUpdate, db: AsyncSession = Depends(get_db)):
    updated = await appointment_crud.update_appointment(db, appointment_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return updated


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(appointment_id: str, db: AsyncSession = Depends(get_db)):
    try:
        await appointment_crud.delete_appointment(db, appointment_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return None

