from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from ..crud import cds_recommendation as cds_crud
from ..schemas.cds_recommendation import (
    CDSRecommendationCreate,
    RecommendationMedication,
    RecommendationTest,
)


def _extract_recommendations(decisions: List[Dict[str, Any]]):
    meds: List[RecommendationMedication] = []
    tests: List[RecommendationTest] = []

    for decision in decisions or []:
        for med in decision.get("medications", []) or []:
            meds.append(RecommendationMedication(name=str(med)))
        for test in decision.get("tests", []) or []:
            tests.append(RecommendationTest(test_name=str(test)))

    return meds, tests


async def save_recommendations(
    db: AsyncSession,
    *,
    patient_id: str,
    visit_id: str,
    decisions: List[Dict[str, Any]],
    risk_classification: Optional[str] = None,
    notes: Optional[str] = None,
    source: Optional[str] = None,
):
    """
    Persist CDS recommendations derived from Drools output.
    """
    meds, tests = _extract_recommendations(decisions)
    payload = CDSRecommendationCreate(
        visit_id=visit_id,
        patient_id=patient_id,
        recommended_medications=meds or None,
        recommended_tests=tests or None,
        risk_classification=risk_classification,
        notes=notes,
        source=source,
    )
    return await cds_crud.create_recommendation(db, payload)

