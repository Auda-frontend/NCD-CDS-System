from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from database.models import Patient

# Create patient
async def create_patient(db: AsyncSession, patient_data):
    new_patient = Patient(**patient_data.dict())
    db.add(new_patient)
    await db.commit()
    await db.refresh(new_patient)
    return new_patient

# Get patient by ID
async def get_patient(db: AsyncSession, patient_id: int):
    result = await db.execute(select(Patient).where(Patient.patient_id == patient_id))
    return result.scalars().first()

# Get all patients
async def get_patients(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(select(Patient).offset(skip).limit(limit))
    return result.scalars().all()

# Update patient
async def update_patient(db: AsyncSession, patient_id: int, patient_data):
    await db.execute(
        update(Patient)
        .where(Patient.patient_id == patient_id)
        .values(**patient_data.dict(exclude_unset=True))
    )
    await db.commit()
    return await get_patient(db, patient_id)

# Delete patient
async def delete_patient(db: AsyncSession, patient_id: int):
    await db.execute(delete(Patient).where(Patient.patient_id == patient_id))
    await db.commit()
    return {"message": f"Patient {patient_id} deleted"}
