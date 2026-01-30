from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from database.models import CDSRecommendation
import logging

logger = logging.getLogger(__name__)


async def create_recommendation(db: AsyncSession, recommendation_data):
    data = recommendation_data.dict()
    recommendation = CDSRecommendation(**data)
    db.add(recommendation)
    await db.flush()
    await db.commit()
    await db.refresh(recommendation)
    logger.info(f"Stored CDS recommendation {recommendation.id} for visit {recommendation.visit_id}")
    return recommendation


async def get_recommendation(db: AsyncSession, recommendation_id: str):
    result = await db.execute(select(CDSRecommendation).where(CDSRecommendation.id == recommendation_id))
    return result.scalars().first()


async def get_recommendations_by_visit(db: AsyncSession, visit_id: str):
    result = await db.execute(select(CDSRecommendation).where(CDSRecommendation.visit_id == visit_id))
    return result.scalars().all()


async def get_recommendations_by_patient(db: AsyncSession, patient_id: str):
    result = await db.execute(select(CDSRecommendation).where(CDSRecommendation.patient_id == patient_id))
    return result.scalars().all()


async def get_all_recommendations(db: AsyncSession, skip: int = 0, limit: int = 1000):
    result = await db.execute(select(CDSRecommendation).offset(skip).limit(limit))
    return result.scalars().all()


async def delete_recommendation(db: AsyncSession, recommendation_id: str):
    result = await db.execute(delete(CDSRecommendation).where(CDSRecommendation.id == recommendation_id))
    await db.commit()
    if result.rowcount == 0:
        raise ValueError(f"CDS recommendation {recommendation_id} not found")
    return {"message": f"CDS recommendation {recommendation_id} deleted"}

