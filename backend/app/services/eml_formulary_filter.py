import json
import re
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

from ..models.patient_models import ClinicalDecision, PatientData


CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "eml_formulary.json"


def _load_config() -> Dict:
    with CONFIG_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def _normalize_token(s: str) -> str:
    return re.sub(r"[^a-z0-9/_ ]+", " ", (s or "").strip().lower()).strip()


def _extract_level_from_text(value: Optional[str], aliases: Dict[str, str]) -> Optional[str]:
    if not value:
        return None
    normalized = _normalize_token(value)
    for alias, canonical in aliases.items():
        if alias in normalized:
            return canonical
    return None


def infer_facility_level(patient_data: PatientData) -> Optional[str]:
    """
    Infer care level from patient context.
    Primary source: consultation.patient_referred_from.
    """
    cfg = _load_config()
    aliases = cfg.get("aliases", {})
    consult = getattr(patient_data, "consultation", None)
    referred_from = getattr(consult, "patient_referred_from", None) if consult else None
    return _extract_level_from_text(referred_from, aliases)


def _matches_medications(line: str, keys: Iterable[str]) -> List[str]:
    norm = _normalize_token(line)
    found = []
    for key in keys:
        if re.search(rf"\b{re.escape(key)}\b", norm):
            found.append(key)
    return found


def _line_allowed_for_level(line: str, facility_level: str, config: Dict) -> bool:
    """
    Keep free-text instructions that do not mention specific medicines.
    If specific medicines are present, allow only if each matched medicine is allowed.
    """
    medications = config.get("medications", {})
    matched = _matches_medications(line, medications.keys())
    if not matched:
        return True
    for med_key in matched:
        allowed_levels = medications.get(med_key, [])
        if facility_level not in allowed_levels:
            return False
    return True


def filter_decisions_for_facility(
    decisions: List[ClinicalDecision], patient_data: PatientData
) -> Tuple[List[ClinicalDecision], Dict[str, int | str]]:
    """
    Filter ClinicalDecision.medications by EML availability at inferred facility level.
    Returns (filtered_decisions, summary).
    """
    facility_level = infer_facility_level(patient_data)
    if not facility_level:
        return decisions, {"filtered_count": 0, "facility_level": "unknown"}

    cfg = _load_config()
    filtered_count = 0

    for decision in decisions or []:
        meds = list(decision.medications or [])
        kept: List[str] = []
        for m in meds:
            if _line_allowed_for_level(m, facility_level, cfg):
                kept.append(m)
            else:
                filtered_count += 1
        decision.medications = kept

    return decisions, {"filtered_count": filtered_count, "facility_level": facility_level}
