from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from ..schemas.test_result import (
    TestResultCreate,
    TestResultUpdate,
    TestResultOut,
    TestResultBulkCreate,
)
from ..crud import test_result as test_crud
from database.session import get_db

router = APIRouter(tags=["Test Results"])


@router.post("/", response_model=TestResultOut, status_code=status.HTTP_201_CREATED)
async def create_test_result(payload: TestResultCreate, db: AsyncSession = Depends(get_db)):
    return await test_crud.create_test_result(db, payload)


@router.post("/bulk", response_model=List[TestResultOut], status_code=status.HTTP_201_CREATED)
async def create_test_results_bulk(payload: TestResultBulkCreate, db: AsyncSession = Depends(get_db)):
    if not payload.tests:
        raise HTTPException(status_code=400, detail="No tests provided")
    return await test_crud.create_test_results_bulk(db, payload.tests)


@router.get("/{test_id}", response_model=TestResultOut)
async def read_test_result(test_id: str, db: AsyncSession = Depends(get_db)):
    obj = await test_crud.get_test_result(db, test_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Test result not found")
    return obj


@router.get("/by-visit/{visit_id}", response_model=List[TestResultOut])
async def read_tests_by_visit(visit_id: str, skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await test_crud.get_tests_by_visit(db, visit_id, skip=skip, limit=limit)


@router.get("/by-patient/{patient_id}", response_model=List[TestResultOut])
async def read_tests_by_patient(patient_id: str, skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await test_crud.get_tests_by_patient(db, patient_id, skip=skip, limit=limit)


@router.put("/{test_id}", response_model=TestResultOut)
async def update_test_result(test_id: str, payload: TestResultUpdate, db: AsyncSession = Depends(get_db)):
    updated = await test_crud.update_test_result(db, test_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Test result not found")
    return updated


@router.delete("/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_test_result(test_id: str, db: AsyncSession = Depends(get_db)):
    try:
        await test_crud.delete_test_result(db, test_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Test result not found")
    return None

