from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
import os
import logging
from datetime import datetime

from ..schemas.cds_recommendation import CDSRecommendationCreate, CDSRecommendationOut
from ..crud import cds_recommendation as recommendation_crud
from ..crud import visit as visit_crud
from ..crud import patient as patient_crud
from database.session import get_db

logger = logging.getLogger(__name__)
router = APIRouter(tags=["CDS Recommendations"])


def calculate_age(date_of_birth):
    """Calculate age from date of birth."""
    if not date_of_birth:
        return 0
    today = datetime.now()
    age = today.year - date_of_birth.year - ((today.month, today.day) < (date_of_birth.month, date_of_birth.day))
    return max(0, age)


@router.post("/", response_model=CDSRecommendationOut, status_code=status.HTTP_201_CREATED)
async def create_recommendation(payload: CDSRecommendationCreate, db: AsyncSession = Depends(get_db)):
    return await recommendation_crud.create_recommendation(db, payload)


@router.get("/", response_model=List[CDSRecommendationOut])
async def read_all_recommendations(skip: int = 0, limit: int = 1000, db: AsyncSession = Depends(get_db)):
    return await recommendation_crud.get_all_recommendations(db, skip=skip, limit=limit)


@router.get("/{recommendation_id}", response_model=CDSRecommendationOut)
async def read_recommendation(recommendation_id: str, db: AsyncSession = Depends(get_db)):
    obj = await recommendation_crud.get_recommendation(db, recommendation_id)
    if not obj:
        raise HTTPException(status_code=404, detail="CDS recommendation not found")
    return obj


@router.get("/by-visit/{visit_id}", response_model=List[CDSRecommendationOut])
async def read_recommendations_by_visit(visit_id: str, db: AsyncSession = Depends(get_db)):
    recommendations = await recommendation_crud.get_recommendations_by_visit(db, visit_id)
    
    # Check if AI explanations are enabled
    ai_enabled = os.getenv("ENABLE_AI_EXPLANATION", "").strip().lower() == "true"
    
    if ai_enabled:
        logger.info(f"AI explanations enabled. Processing {len(recommendations)} recommendations")
        # Generate explanations for recommendations that don't have them
        for rec in recommendations:
            # Initialize explanations as empty list if None
            if rec.explanations is None:
                rec.explanations = []
            
            # Check if we need to generate explanations
            needs_explanations = isinstance(rec.explanations, list) and len(rec.explanations) == 0
            
            if needs_explanations:
                logger.info(f"Recommendation {rec.id} needs explanations. decisions={bool(rec.decisions)}")
                try:
                    # Get visit and patient data
                    visit = await visit_crud.get_visit(db, rec.visit_id)
                    if not visit:
                        logger.warning(f"Visit {rec.visit_id} not found for recommendation {rec.id}")
                        continue
                    
                    patient = await patient_crud.get_patient(db, str(visit.patient_id))
                    if not patient:
                        logger.warning(f"Patient {visit.patient_id} not found")
                        continue
                    
                    # Build patient context
                    patient_ctx = {
                        "age": calculate_age(patient.date_of_birth),
                        "gender": patient.gender or "Unknown",
                        "systolic": visit.systole or 0,
                        "diastolic": visit.diastole or 0,
                    }
                    
                    # Import llm_service
                    import sys
                    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                    if backend_dir not in sys.path:
                        sys.path.insert(0, backend_dir)
                    import llm_service
                    
                    # Generate explanations for each decision
                    explanations = []
                    if rec.decisions:
                        logger.info(f"Generating explanations for {len(rec.decisions)} decision(s) in recommendation {rec.id}")
                        for i, decision in enumerate(rec.decisions):
                            logger.info(f"  Processing decision {i}: {decision.get('diagnosis', 'Unknown')}")
                            # Normalize decision keys to match llm_service expectations
                            # Handle both snake_case and camelCase variations
                            normalized_decision = {
                                "diagnosis": decision.get("diagnosis") or "",
                                "stage": decision.get("stage") or "",
                                "medications": decision.get("medications") or decision.get("meds") or [],
                                "tests": decision.get("tests") or [],
                                "needsReferral": decision.get("needsReferral") or decision.get("needs_referral") or False,
                                "referralReason": decision.get("referralReason") or decision.get("referral_reason"),
                                "confidenceLevel": decision.get("confidenceLevel") or decision.get("confidence_level"),
                            }
                            
                            raw = llm_service.generate_explanation(normalized_decision, patient_ctx)
                            explanations.append({
                                "clinician_summary": raw.get("clinician_summary") or "",
                                "clinician_explanation": raw.get("clinician_explanation") or "",
                                "patient_summary": raw.get("patient_summary") or "",
                                "patient_explanation": raw.get("patient_explanation") or "",
                                "sources": raw.get("sources") or [],
                            })
                            logger.info(f"  Explanation {i} generated: {len(raw.get('clinician_summary', ''))} chars clinician text")
                    else:
                        logger.warning(f"No decisions found in recommendation {rec.id}")
                    
                    # Update the recommendation with explanations
                    if explanations:
                        rec.explanations = explanations
                        await db.commit()
                        logger.info(f"Generated {len(explanations)} explanations for recommendation {rec.id}")
                    else:
                        logger.warning(f"No explanations were generated for recommendation {rec.id}")
                        
                except Exception as e:
                    logger.error(f"Failed to generate explanations for recommendation {rec.id}: {e}", exc_info=True)
            else:
                logger.debug(f"Recommendation {rec.id} already has {len(rec.explanations)} explanations")
    
    return recommendations


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

