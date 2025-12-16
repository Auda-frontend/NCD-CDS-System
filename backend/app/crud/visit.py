from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from sqlalchemy.exc import IntegrityError
from database.models import Visit, Patient
import logging
import uuid

logger = logging.getLogger(__name__)


# Create visit
async def create_visit(db: AsyncSession, visit_data):
    data = visit_data.dict()
    
    # Validate patient_id exists
    patient_id = data.get("patient_id")
    if not patient_id:
        raise ValueError("patient_id is required")
    
    # Check if patient exists (support both UUID and patient_id string)
    patient = None
    try:
        # Try as UUID first
        uuid.UUID(patient_id)
        result = await db.execute(select(Patient).where(Patient.id == patient_id))
        patient = result.scalars().first()
        
        # If not found, try patient_id field
        if not patient:
            result = await db.execute(select(Patient).where(Patient.patient_id == patient_id))
            patient = result.scalars().first()
    except ValueError:
        # Not a UUID, try patient_id field
        result = await db.execute(select(Patient).where(Patient.patient_id == patient_id))
        patient = result.scalars().first()
    
    if not patient:
        raise ValueError(f"Patient with id '{patient_id}' not found")
    
    # Use the patient's UUID id for the foreign key
    data["patient_id"] = patient.id
    
    # Only map known DB columns
    allowed = {
        "patient_id", "visit_date", "clinician", "reason", "chief_complaint",
        "complaints", "symptoms", "consultation", "medical_history",
        "social_history", "physical_examination", "investigations", "notes",
        "systole", "diastole", "weight_kg", "height_cm", "bmi",
        "pulse", "temperature", "spo2", "pain_score",
        "clinical_decisions"
    }
    obj_kwargs = {k: v for k, v in data.items() if k in allowed and v is not None}
    
    logger.info(f"Creating visit with data: {obj_kwargs}")
    
    # Auto-calc BMI if height/weight provided and bmi missing
    if not obj_kwargs.get("bmi") and obj_kwargs.get("height_cm") and obj_kwargs.get("weight_kg"):
        h_m = obj_kwargs["height_cm"] / 100.0
        if h_m > 0:
            obj_kwargs["bmi"] = round(obj_kwargs["weight_kg"] / (h_m * h_m), 1)

    new_visit = Visit(**obj_kwargs)
    db.add(new_visit)
    
    try:
        await db.flush()
        logger.info(f"Flushed visit, ID: {new_visit.id}")
        await db.commit()
        logger.info(f"Committed visit: {new_visit.id}")
        await db.refresh(new_visit)
        logger.info(f"Refreshed visit: {new_visit.id}")
        return new_visit
    except IntegrityError as e:
        logger.error(f"IntegrityError during create: {e}")
        await db.rollback()
        raise
    except Exception as e:
        logger.error(f"Unexpected error during create: {e}")
        await db.rollback()
        raise


# Get visit by ID
async def get_visit(db: AsyncSession, visit_id: str):
    try:
        uuid.UUID(visit_id)  # Validate UUID format
        result = await db.execute(select(Visit).where(Visit.id == visit_id))
        visit = result.scalars().first()
        return visit
    except ValueError:
        logger.warning(f"Invalid UUID format: {visit_id}")
        return None


# Get all visits
async def get_visits(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(select(Visit).offset(skip).limit(limit).order_by(Visit.visit_date.desc()))
    return result.scalars().all()


# Get visits by patient_id
async def get_visits_by_patient(db: AsyncSession, patient_id: str, skip: int = 0, limit: int = 100):
    # First, find the patient to get their UUID
    patient = None
    try:
        uuid.UUID(patient_id)
        result = await db.execute(select(Patient).where(Patient.id == patient_id))
        patient = result.scalars().first()
        
        if not patient:
            result = await db.execute(select(Patient).where(Patient.patient_id == patient_id))
            patient = result.scalars().first()
    except ValueError:
        result = await db.execute(select(Patient).where(Patient.patient_id == patient_id))
        patient = result.scalars().first()
    
    if not patient:
        return []
    
    # Query visits using the patient's UUID
    result = await db.execute(
        select(Visit)
        .where(Visit.patient_id == patient.id)
        .offset(skip)
        .limit(limit)
        .order_by(Visit.visit_date.desc())
    )
    return result.scalars().all()


# Update visit
async def update_visit(db: AsyncSession, visit_id: str, visit_data):
    values = visit_data.dict(exclude_unset=True)
    
    # Filter only allowed columns (exclude patient_id from updates)
    allowed = {
        "visit_date", "clinician", "reason", "chief_complaint",
        "complaints", "symptoms", "consultation", "medical_history",
        "social_history", "physical_examination", "investigations", "notes",
        "systole", "diastole", "weight_kg", "height_cm", "bmi",
        "pulse", "temperature", "spo2", "pain_score",
        "clinical_decisions"
    }
    update_values = {k: v for k, v in values.items() if k in allowed}
    
    if not update_values:
        return await get_visit(db, visit_id)
    
    try:
        uuid.UUID(visit_id)  # Validate UUID format
    except ValueError:
        raise ValueError(f"Invalid visit_id format: {visit_id}")
    
    try:
        result = await db.execute(
            update(Visit)
            .where(Visit.id == visit_id)
            .values(**update_values)
        )
        await db.commit()
        logger.info(f"Updated visit: {visit_id}, rows affected: {result.rowcount}")
        
        if result.rowcount == 0:
            return None
        updated = await get_visit(db, visit_id)

        # If BMI missing but height/weight present in updated values, compute
        if updated and updated.height_cm and updated.weight_kg and not updated.bmi:
            h_m = updated.height_cm / 100.0
            if h_m > 0:
                updated.bmi = round(updated.weight_kg / (h_m * h_m), 1)
                await db.execute(
                    update(Visit)
                    .where(Visit.id == visit_id)
                    .values(bmi=updated.bmi)
                )
                await db.commit()
        return updated
    except Exception as e:
        logger.error(f"Error updating visit {visit_id}: {e}")
        await db.rollback()
        raise


# Delete visit
async def delete_visit(db: AsyncSession, visit_id: str):
    try:
        uuid.UUID(visit_id)  # Validate UUID format
    except ValueError:
        raise ValueError(f"Invalid visit_id format: {visit_id}")
    
    try:
        result = await db.execute(delete(Visit).where(Visit.id == visit_id))
        await db.commit()
        logger.info(f"Deleted visit: {visit_id}, rows affected: {result.rowcount}")
        
        if result.rowcount == 0:
            raise ValueError(f"Visit {visit_id} not found")
        
        return {"message": f"Visit {visit_id} deleted"}
    except Exception as e:
        logger.error(f"Error deleting visit {visit_id}: {e}")
        await db.rollback()
        raise
