from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
import os
import time
import logging
from ..models.patient_models import (
    CDSRequest,
    CDSResponse,
    PatientData,
    HealthCheck,
    ClinicalDecision,
    AIExplanationOut,
    ExplainRequest,
    ExplainResponse,
)
from ..services.drools_integration import DroolsIntegrationService
from ..services.eml_formulary_filter import filter_decisions_for_facility
from database.session import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/cds", tags=["Clinical Decision Support"])

# Initialize the Drools service
drools_service = DroolsIntegrationService()


def _decision_to_dict(d: ClinicalDecision) -> dict:
    """Convert ClinicalDecision to dict expected by llm_service (camelCase for needsReferral)."""
    return {
        "diagnosis": d.diagnosis,
        "stage": d.stage,
        "subClassification": d.sub_classification,
        "medications": d.medications or [],
        "tests": d.tests or [],
        "patientAdvice": d.patient_advice,
        "needsReferral": d.needs_referral,
        "referralReason": d.referral_reason,
        "confidenceLevel": d.confidence_level,
    }


def _patient_context_from_patient_data(patient_data: PatientData) -> dict:
    """Build patient context dict for llm_service.generate_explanation."""
    return {
        "age": patient_data.demographics.age or 0,
        "gender": patient_data.demographics.gender.value if hasattr(patient_data.demographics.gender, "value") else str(patient_data.demographics.gender),
        "systolic": patient_data.physical_examination.systole or 0,
        "diastolic": patient_data.physical_examination.diastole or 0,
    }


def _fetch_explanations_for_decisions(
    clinical_decisions: List[ClinicalDecision],
    patient_data: PatientData,
) -> List[Optional[AIExplanationOut]]:
    """
    Call AI explanation for each decision when ENABLE_AI_EXPLANATION is true.
    Non-blocking: failures are logged and that decision gets None explanation.
    """
    if os.getenv("ENABLE_AI_EXPLANATION", "").strip().lower() != "true":
        return []
    try:
        import sys
        # Ensure backend root is on path so llm_service can be imported
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        if backend_dir not in sys.path:
            sys.path.insert(0, backend_dir)
        import llm_service
    except Exception as e:
        logger.warning("AI explanation skipped: could not import llm_service: %s", e)
        return []

    patient_ctx = _patient_context_from_patient_data(patient_data)
    out: List[Optional[AIExplanationOut]] = []
    for d in clinical_decisions or []:
        try:
            raw = llm_service.generate_explanation(_decision_to_dict(d), patient_ctx)
            out.append(
                AIExplanationOut(
                    clinician_summary=raw.get("clinician_summary") or "",
                    clinician_explanation=raw.get("clinician_explanation") or "",
                    patient_summary=raw.get("patient_summary") or "",
                    patient_explanation=raw.get("patient_explanation") or "",
                    sources=raw.get("sources") or [],
                )
            )
        except Exception as e:
            logger.warning("AI explanation failed for one decision: %s", e)
            out.append(None)
    return out

@router.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint"""
    return HealthCheck(
        status="healthy",
        timestamp=time.strftime("%Y-%m-%d %H:%M:%S")
    )


@router.post("/explain", response_model=ExplainResponse)
async def explain_decision(body: ExplainRequest):
    """
    Generate AI explanation (clinician + patient, summary + full) for a single Drools decision.
    Uses RAG (Qdrant) and LLM (Groq). Respects ENABLE_AI_EXPLANATION env.
    """
    if os.getenv("ENABLE_AI_EXPLANATION", "").strip().lower() != "true":
        return ExplainResponse(ai_enabled=False)
    try:
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        import sys
        if backend_dir not in sys.path:
            sys.path.insert(0, backend_dir)
        import llm_service
        raw = llm_service.generate_explanation(body.decision, body.patient)
        return ExplainResponse(
            clinician_explanation=raw.get("clinician_explanation") or "",
            clinician_summary=raw.get("clinician_summary") or "",
            patient_explanation=raw.get("patient_explanation") or "",
            patient_summary=raw.get("patient_summary") or "",
            sources=raw.get("sources") or [],
            rag_grounded=raw.get("rag_grounded", False),
            chunks_used=raw.get("chunks_used", 0),
            ai_enabled=raw.get("ai_enabled", False),
        )
    except Exception as e:
        logger.warning("Explain endpoint failed: %s", e)
        raise HTTPException(status_code=503, detail=f"AI explanation unavailable: {e}")


@router.post("/evaluate", response_model=CDSResponse)
async def evaluate_patient(request: CDSRequest, db: AsyncSession = Depends(get_db)):
    """
    Evaluate patient data and provide clinical decision support
    for hypertension management based on Rwanda guidelines.
    Saves recommendations to database. AI explanation is additive (non-blocking).
    """
    try:
        response = drools_service.evaluate_patient(request.patient_data)
        response.clinical_decisions, formulary_summary = filter_decisions_for_facility(
            response.clinical_decisions or [], request.patient_data
        )

        # AI explanation is additive — failure never blocks clinical decision
        explanations: List[Optional[AIExplanationOut]] = []
        if response.success and response.clinical_decisions:
            explanations = _fetch_explanations_for_decisions(
                response.clinical_decisions,
                request.patient_data,
            )

        if response.success and response.clinical_decisions:
            # Save recommendations to database (including explanations when present)
            from ..services import cds_recommendation_service
            from ..crud import visit as visit_crud
            decisions_dict = [d.dict() for d in (response.clinical_decisions or [])]
            # Resolve patient_id from visit when possible (visit_id is required)
            patient_id = request.patient_data.demographics.patient_id
            if not patient_id:
                visit_obj = await visit_crud.get_visit(db, request.visit_id)
                if visit_obj:
                    patient_id = str(visit_obj.patient_id)
            if not patient_id:
                patient_id = ""  # may fail FK if not provided elsewhere
            await cds_recommendation_service.save_recommendations(
                db=db,
                patient_id=patient_id,
                visit_id=request.visit_id,
                decisions=decisions_dict,
                risk_classification=getattr(response, "risk_classification", None),
                notes=(
                    "Manual CDS evaluation"
                    f" | EML filter: {formulary_summary.get('filtered_count', 0)} option(s) filtered"
                    f" at {formulary_summary.get('facility_level', 'unknown')}"
                ),
                source="DROOLS",
                explanations=[e.dict() if e else None for e in explanations] if explanations else None,
            )
        else:
            logger.warning(
                "Skipping CDS recommendation persistence: success=%s decisions=%s visit_id=%s",
                response.success,
                len(response.clinical_decisions or []),
                request.visit_id,
            )

        return CDSResponse(
            success=response.success,
            message=(
                f"{response.message} "
                f"(EML filter at {formulary_summary.get('facility_level', 'unknown')}: "
                f"{formulary_summary.get('filtered_count', 0)} option(s) removed)"
            ),
            clinical_decisions=response.clinical_decisions,
            patient_data=response.patient_data,
            execution_time_ms=response.execution_time_ms,
            explanations=explanations if explanations else None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/evaluate-direct", response_model=CDSResponse)
async def evaluate_patient_direct(patient_data: PatientData):
    """
    Evaluate patient data directly (without nested patient_data field).
    AI explanation is additive (non-blocking).
    """
    try:
        response = drools_service.evaluate_patient(patient_data)
        response.clinical_decisions, formulary_summary = filter_decisions_for_facility(
            response.clinical_decisions or [], patient_data
        )

        # AI explanation is additive — failure never blocks clinical decision
        explanations: List[Optional[AIExplanationOut]] = []
        if response.clinical_decisions:
            explanations = _fetch_explanations_for_decisions(
                response.clinical_decisions,
                patient_data,
            )

        return CDSResponse(
            success=response.success,
            message=(
                f"{response.message} "
                f"(EML filter at {formulary_summary.get('facility_level', 'unknown')}: "
                f"{formulary_summary.get('filtered_count', 0)} option(s) removed)"
            ),
            clinical_decisions=response.clinical_decisions,
            patient_data=response.patient_data,
            execution_time_ms=response.execution_time_ms,
            explanations=explanations if explanations else None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))