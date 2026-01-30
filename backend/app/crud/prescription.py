from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from database.models import Prescription, Visit
import logging
from typing import List

logger = logging.getLogger(__name__)


async def create_prescription(db: AsyncSession, prescription_data):
    data = prescription_data.dict()
    new_prescription = Prescription(**data)
    db.add(new_prescription)
    await db.flush()
    await db.commit()
    await db.refresh(new_prescription)
    logger.info(f"Created prescription {new_prescription.id} for visit {new_prescription.visit_id}")
    return new_prescription


async def create_prescriptions_bulk(db: AsyncSession, prescriptions_data: List):
    items = [Prescription(**item.dict()) for item in prescriptions_data]
    db.add_all(items)
    await db.flush()
    await db.commit()
    for item in items:
        await db.refresh(item)
    logger.info(f"Created {len(items)} prescriptions (bulk)")
    return items


async def get_prescription(db: AsyncSession, prescription_id: str):
    result = await db.execute(select(Prescription).where(Prescription.id == prescription_id))
    return result.scalars().first()


async def get_all_prescriptions(db: AsyncSession, skip: int = 0, limit: int = 1000):
    result = await db.execute(
        select(Prescription)
        .offset(skip)
        .limit(limit)
        .order_by(Prescription.created_at.desc())
    )
    return result.scalars().all()


async def get_prescriptions_by_visit(db: AsyncSession, visit_id: str, skip: int = 0, limit: int = 100):
    result = await db.execute(
        select(Prescription)
        .where(Prescription.visit_id == visit_id)
        .offset(skip)
        .limit(limit)
        .order_by(Prescription.created_at.desc())
    )
    return result.scalars().all()


async def get_prescriptions_by_patient(db: AsyncSession, patient_id: str, skip: int = 0, limit: int = 100):
    result = await db.execute(
        select(Prescription)
        .join(Visit, Prescription.visit_id == Visit.id)
        .where(Visit.patient_id == patient_id)
        .offset(skip)
        .limit(limit)
        .order_by(Prescription.created_at.desc())
    )
    return result.scalars().all()


async def update_prescription(db: AsyncSession, prescription_id: str, prescription_data):
    values = prescription_data.dict(exclude_unset=True)
    result = await db.execute(
        update(Prescription)
        .where(Prescription.id == prescription_id)
        .values(**values)
    )
    await db.commit()
    if result.rowcount == 0:
        return None
    return await get_prescription(db, prescription_id)


async def delete_prescription(db: AsyncSession, prescription_id: str):
    result = await db.execute(delete(Prescription).where(Prescription.id == prescription_id))
    await db.commit()
    if result.rowcount == 0:
        raise ValueError(f"Prescription {prescription_id} not found")
    return {"message": f"Prescription {prescription_id} deleted"}

