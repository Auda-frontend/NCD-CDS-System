from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from ..schemas.cds_recommendation import CDSRecommendationCreate, CDSRecommendationOut
from ..crud import cds_recommendation as recommendation_crud
from database.session import get_db

router = APIRouter(tags=["CDS Recommendations"])


@router.post("/", response_model=CDSRecommendationOut, status_code=status.HTTP_201_CREATED)
async def create_recommendation(payload: CDSRecommendationCreate, db: AsyncSession = Depends(get_db)):
    return await recommendation_crud.create_recommendation(db, payload)


@router.get("/{recommendation_id}", response_model=CDSRecommendationOut)
async def read_recommendation(recommendation_id: str, db: AsyncSession = Depends(get_db)):
    obj = await recommendation_crud.get_recommendation(db, recommendation_id)
    if not obj:
        raise HTTPException(status_code=404, detail="CDS recommendation not found")
    return obj


@router.get("/by-visit/{visit_id}", response_model=List[CDSRecommendationOut])
async def read_recommendations_by_visit(visit_id: str, db: AsyncSession = Depends(get_db)):
    return await recommendation_crud.get_recommendations_by_visit(db, visit_id)


@router.get("/by-patient/{patient_id}", response_model=List[CDSRecommendationOut])
async def read_recommendations_by_patient(patient_id: str, db: AsyncSession = Depends(get_db)):
    return await recommendation_crud.get_recommendations_by_patient(db, patient_id)


@router.delete("/{recommendation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recommendation(recommendation_id: str, db: AsyncSession = Depends(get_db)):
    try:
        await recommendation_crud.delete_recommendation(db, recommendation_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="CDS recommendation not found")
    return None

