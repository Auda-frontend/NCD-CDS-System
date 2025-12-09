from fastapi import APIRouter, Depends, HTTPException, status, Response
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from ..schemas.visit import VisitCreate, VisitUpdate, VisitOut
from ..crud import visit as visit_crud
from database.session import get_db

router = APIRouter(
    tags=["Visits"]
)


# Create visit
@router.post("/", response_model=VisitOut, status_code=status.HTTP_201_CREATED)
async def create_visit(visit: VisitCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await visit_crud.create_visit(db, visit)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Visit could not be created due to integrity constraint violation"
        )


# Get all visits
@router.get("/", response_model=List[VisitOut])
async def read_visits(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    return await visit_crud.get_visits(db, skip=skip, limit=limit)


# Get single visit
@router.get("/{visit_id}", response_model=VisitOut)
async def read_visit(visit_id: str, db: AsyncSession = Depends(get_db)):
    visit = await visit_crud.get_visit(db, visit_id)
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    return visit


# Update visit
@router.put("/{visit_id}", response_model=VisitOut)
async def update_visit(
    visit_id: str,
    visit: VisitUpdate,
    db: AsyncSession = Depends(get_db)
):
    existing_visit = await visit_crud.get_visit(db, visit_id)
    if not existing_visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    try:
        return await visit_crud.update_visit(db, visit_id, visit)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# Delete visit
@router.delete("/{visit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_visit(visit_id: str, db: AsyncSession = Depends(get_db)):
    existing_visit = await visit_crud.get_visit(db, visit_id)
    if not existing_visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    try:
        await visit_crud.delete_visit(db, visit_id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
