from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from database.models import Appointment, AppointmentStatus
import logging

logger = logging.getLogger(__name__)


async def create_appointment(db: AsyncSession, appointment_data):
    data = appointment_data.dict()
    appointment = Appointment(**data)
    db.add(appointment)
    await db.flush()
    await db.commit()
    await db.refresh(appointment)
    logger.info(f"Created appointment {appointment.id} for patient {appointment.patient_id}")
    return appointment


async def get_appointment(db: AsyncSession, appointment_id: str):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    return result.scalars().first()


async def get_appointments_by_patient(db: AsyncSession, patient_id: str, skip: int = 0, limit: int = 100):
    result = await db.execute(
        select(Appointment)
        .where(Appointment.patient_id == patient_id)
        .offset(skip)
        .limit(limit)
        .order_by(Appointment.scheduled_at.desc())
    )
    return result.scalars().all()


async def get_appointments(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(
        select(Appointment)
        .offset(skip)
        .limit(limit)
        .order_by(Appointment.scheduled_at.desc())
    )
    return result.scalars().all()


async def update_appointment(db: AsyncSession, appointment_id: str, appointment_data):
    values = appointment_data.dict(exclude_unset=True)

    # If status is being set to MISSED and caller did not explicitly send missed_count,
    # automatically increment missed_count to keep follow_up_state accurate.
    if "status" in values and values["status"] == AppointmentStatus.MISSED and "missed_count" not in values:
        existing = await get_appointment(db, appointment_id)
        if existing:
            current_missed = existing.missed_count or 0
            values["missed_count"] = current_missed + 1

    result = await db.execute(
        update(Appointment)
        .where(Appointment.id == appointment_id)
        .values(**values)
    )
    await db.commit()
    if result.rowcount == 0:
        return None
    return await get_appointment(db, appointment_id)


async def delete_appointment(db: AsyncSession, appointment_id: str):
    result = await db.execute(delete(Appointment).where(Appointment.id == appointment_id))
    await db.commit()
    if result.rowcount == 0:
        raise ValueError(f"Appointment {appointment_id} not found")
    return {"message": f"Appointment {appointment_id} deleted"}

