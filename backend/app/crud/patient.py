from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete, or_
from sqlalchemy.exc import IntegrityError
from database.models import Patient
import logging

logger = logging.getLogger(__name__)


# Create patient
async def create_patient(db: AsyncSession, patient_data):
    data = patient_data.dict()
    # Only map known DB columns
    allowed = {"patient_id", "full_name", "gender", "phone", "date_of_birth"}
    obj_kwargs = {k: v for k, v in data.items() if k in allowed and v is not None}
    logger.info(f"Creating patient with data: {obj_kwargs}")
    
    new_patient = Patient(**obj_kwargs)
    db.add(new_patient)
    
    try:
        await db.flush()  # Flush first to get ID and trigger server defaults
        logger.info(f"Flushed patient, ID: {new_patient.id}")
        await db.commit()
        logger.info(f"Committed patient: {new_patient.id}")
        # Refresh to ensure object is synced with database
        await db.refresh(new_patient)
        logger.info(f"Refreshed patient: {new_patient.id}, name: {new_patient.full_name}")
        return new_patient
    except IntegrityError as e:
        logger.error(f"IntegrityError during create: {e}")
        await db.rollback()
        raise
    except Exception as e:
        logger.error(f"Unexpected error during create: {e}")
        await db.rollback()
        raise


# Get patient by ID (supports searching by patient_id string or UUID primary key)
async def get_patient(db: AsyncSession, patient_id: str):
    # Try to match by patient_id first, or by UUID id if it's a valid UUID
    query = select(Patient).where(Patient.patient_id == patient_id)
    result = await db.execute(query)
    patient = result.scalars().first()
    
    # If not found by patient_id and input looks like a UUID, try matching by id
    if not patient:
        try:
            import uuid
            uuid.UUID(patient_id)  # Validate UUID format
            result = await db.execute(select(Patient).where(Patient.id == patient_id))
            patient = result.scalars().first()
        except (ValueError, AttributeError):
            pass  # Not a UUID, skip
    
    return patient


# Get all patients
async def get_patients(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(select(Patient).offset(skip).limit(limit))
    return result.scalars().all()


# Update patient
async def update_patient(db: AsyncSession, patient_id: str, patient_data):
    values = patient_data.dict(exclude_unset=True)
    # filter only allowed columns
    allowed = {"patient_id", "full_name", "gender", "phone", "date_of_birth"}
    update_values = {k: v for k, v in values.items() if k in allowed}
    if not update_values:
        return await get_patient(db, patient_id)

    # Build query to match by patient_id or UUID id
    where_clause = Patient.patient_id == patient_id
    try:
        import uuid
        uuid.UUID(patient_id)
        where_clause = or_(Patient.patient_id == patient_id, Patient.id == patient_id)
    except (ValueError, AttributeError):
        pass  # Not a UUID, just use patient_id

    try:
        result = await db.execute(
            update(Patient)
            .where(where_clause)
            .values(**update_values)
        )
        await db.commit()
        logger.info(f"Updated patient: {patient_id}, rows affected: {result.rowcount}")
        return await get_patient(db, patient_id)
    except Exception as e:
        logger.error(f"Error updating patient {patient_id}: {e}")
        await db.rollback()
        raise




# Delete patient
async def delete_patient(db: AsyncSession, patient_id: str):
    # Build query to match by patient_id or UUID id
    where_clause = Patient.patient_id == patient_id
    try:
        import uuid
        uuid.UUID(patient_id)
        where_clause = or_(Patient.patient_id == patient_id, Patient.id == patient_id)
    except (ValueError, AttributeError):
        pass  # Not a UUID, just use patient_id

    try:
        result = await db.execute(delete(Patient).where(where_clause))
        await db.commit()
        logger.info(f"Deleted patient: {patient_id}, rows affected: {result.rowcount}")
        if result.rowcount == 0:
            raise ValueError(f"Patient {patient_id} not found")
        return {"message": f"Patient {patient_id} deleted"}
    except Exception as e:
        logger.error(f"Error deleting patient {patient_id}: {e}")
        await db.rollback()
        raise
