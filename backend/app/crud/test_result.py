from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from database.models import TestResult, TestStatus, Visit
import logging
from typing import List

logger = logging.getLogger(__name__)


async def create_test_result(db: AsyncSession, test_data):
    data = test_data.dict()
    # Normalize investigation_data if empty
    if not data.get("investigation_data"):
        data.pop("investigation_data", None)
    if data.get("value") is None:
        data["value"] = ""
    new_test = TestResult(**data)
    db.add(new_test)
    await db.flush()
    await db.commit()
    await db.refresh(new_test)
    logger.info(f"Created test result {new_test.id} for visit {new_test.visit_id}")
    return new_test


async def create_test_results_bulk(db: AsyncSession, tests_data: List):
    items = []
    for t in tests_data:
        data = t.dict()
        # recommendation_id is not a column on TestResult; drop if present
        data.pop("recommendation_id", None)
        if not data.get("investigation_data"):
            data.pop("investigation_data", None)
        # value is required by the DB schema; default to empty string if missing/None
        if data.get("value") is None:
            data["value"] = ""
        items.append(TestResult(**data))
    db.add_all(items)
    await db.flush()
    await db.commit()
    for item in items:
        await db.refresh(item)
    logger.info(f"Created {len(items)} test results (bulk)")
    return items


async def get_test_result(db: AsyncSession, test_id: str):
    result = await db.execute(select(TestResult).where(TestResult.id == test_id))
    return result.scalars().first()


async def get_tests_by_visit(db: AsyncSession, visit_id: str, skip: int = 0, limit: int = 100):
    result = await db.execute(
        select(TestResult)
        .where(TestResult.visit_id == visit_id)
        .offset(skip)
        .limit(limit)
        .order_by(TestResult.created_at.desc())
    )
    return result.scalars().all()


async def get_tests_by_patient(db: AsyncSession, patient_id: str, skip: int = 0, limit: int = 100):
    # join via Visit
    result = await db.execute(
        select(TestResult)
        .join(Visit, TestResult.visit_id == Visit.id)
        .where(Visit.patient_id == patient_id)
        .offset(skip)
        .limit(limit)
        .order_by(TestResult.created_at.desc())
    )
    return result.scalars().all()


async def update_test_result(db: AsyncSession, test_id: str, test_data):
    values = test_data.dict(exclude_unset=True)
    if "investigation_data" in values and not values["investigation_data"]:
        values["investigation_data"] = None
    result = await db.execute(
        update(TestResult)
        .where(TestResult.id == test_id)
        .values(**values)
    )
    await db.commit()
    if result.rowcount == 0:
        return None
    return await get_test_result(db, test_id)


async def delete_test_result(db: AsyncSession, test_id: str):
    result = await db.execute(delete(TestResult).where(TestResult.id == test_id))
    await db.commit()
    if result.rowcount == 0:
        raise ValueError(f"Test result {test_id} not found")
    return {"message": f"Test result {test_id} deleted"}

