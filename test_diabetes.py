# test_diabetes.py
# Run from project root: python test_diabetes.py

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from llm_service import generate_explanation, health_check

print("\n" + "="*60)
print("NCD-CDS — Diabetes Standalone Test")
print("="*60)

# Health check
print("\n─── Health Check ───────────────────────────────────────")
health = health_check()
print(f"  Groq:     {'✓' if health['groq'] else '✗'}")
print(f"  Qdrant:   {'✓' if health['qdrant'] else '✗'}")
print(f"  Embedder: {'✓' if health['embedder'] else '✗'}")

if not health["all_healthy"]:
    print("\n✗ Services not healthy — fix before running tests")
    sys.exit(1)

print("\n✓ All services healthy\n")

# ── Diabetes Test Cases ─────────────────────────────────────────────

diabetes_cases = [
    {
        "name": "Test D1 — Type 2 Diabetes, Newly Diagnosed Female",
        "decision": {
            "diagnosis": "Type 2 Diabetes Mellitus",
            "stage": "Newly diagnosed",
            "medications": ["Metformin 500mg twice daily"],
            "tests": ["HbA1c", "Fasting blood glucose", "Renal function"],
            "needsReferral": False
        },
        "patient": {
            "age": 47, "gender": "Female",
            "systolic": 138, "diastolic": 88
        }
    },
    {
        "name": "Test D2 — Type 2 Diabetes, Uncontrolled at Follow-up",
        "decision": {
            "diagnosis": "Type 2 Diabetes Mellitus",
            "stage": "Uncontrolled — HbA1c above target",
            "medications": ["Metformin 1000mg twice daily"],
            "tests": ["HbA1c", "Renal function", "Fasting lipids"],
            "needsReferral": False
        },
        "patient": {
            "age": 55, "gender": "Male",
            "systolic": 142, "diastolic": 90
        }
    },
    {
        "name": "Test D3 — Diabetes with Renal Impairment",
        "decision": {
            "diagnosis": "Type 2 Diabetes Mellitus",
            "stage": "Established — renal impairment",
            "medications": ["Insulin 10 units at bedtime"],
            "tests": ["HbA1c", "Serum Creatinine", "eGFR",
                      "Urine albumin-creatinine ratio"],
            "needsReferral": True
        },
        "patient": {
            "age": 58, "gender": "Male",
            "systolic": 148, "diastolic": 94
        }
    },
    {
        "name": "Test D4 — Diabetic Ketoacidosis Emergency",
        "decision": {
            "diagnosis": "Diabetic Ketoacidosis",
            "stage": "Severe",
            "medications": ["Insulin IV protocol"],
            "tests": ["Blood glucose", "Serum ketones",
                      "Arterial blood gas", "Serum electrolytes",
                      "Serum Creatinine"],
            "needsReferral": True
        },
        "patient": {
            "age": 34, "gender": "Male",
            "systolic": 98, "diastolic": 62
        }
    },
    {
        "name": "Test D5 — Edge Case: No Guideline Context",
        "decision": {
            "diagnosis": "Type 2 Diabetes Mellitus",
            "stage": "Newly diagnosed",
            "medications": ["Metformin 500mg twice daily"],
            "tests": ["HbA1c"],
            "needsReferral": False,
            "_force_no_context": True
        },
        "patient": {
            "age": 50, "gender": "Female",
            "systolic": 130, "diastolic": 82
        }
    }
]

# ── Evaluation Checklist ────────────────────────────────────────────

CLINICIAN_CHECKLIST = [
    ("All 6 section headers present",
     ["CLINICAL FINDING", "REASONING", "TREATMENT RATIONALE",
      "MONITORING PURPOSE", "SAFETY POINTS", "FOLLOW-UP"]),
    ("Cites Rwanda guidelines not ESC/ESH/JNC",
     ["Rwanda", "rwanda"]),
    ("Does NOT contain system prompt leakage",
     ["ABSOLUTE RULES", "Never suggest diagnoses"]),
    ("Metformin renal contraindication mentioned in D1/D2",
     ["eGFR", "renal", "creatinine", "contraindicated"]),
    ("Emergency cases open with THIS IS A TIME-SENSITIVE EMERGENCY",
     ["TIME-SENSITIVE EMERGENCY"]),
]

PATIENT_CHECKLIST = [
    ("Written in second person",
     ["You ", "Your ", "you "]),
    ("DANGER SIGNS section present",
     ["DANGER SIGNS", "COME BACK IMMEDIATELY"]),
    ("No third-person references",
     ["The patient", "the patient"]),
    ("Next appointment section present",
     ["NEXT APPOINTMENT"]),
]

def evaluate_clinician(text: str, case_name: str) -> dict:
    results = {}
    for check_name, keywords in CLINICIAN_CHECKLIST:
        if "section headers" in check_name:
            passed = all(kw in text for kw in keywords)
        elif "NOT contain" in check_name:
            passed = not any(kw in text for kw in keywords)
        elif "Emergency" in check_name and "D4" not in case_name:
            passed = True  # Skip emergency check for non-emergency cases
        else:
            passed = any(kw in text for kw in keywords)
        results[check_name] = passed
    return results

def evaluate_patient(text: str) -> dict:
    results = {}
    for check_name, keywords in PATIENT_CHECKLIST:
        if "No third-person" in check_name:
            passed = not any(kw in text for kw in keywords)
        else:
            passed = any(kw in text for kw in keywords)
        results[check_name] = passed
    return results

# ── Run All Cases ───────────────────────────────────────────────────

overall_clinician_pass = 0
overall_patient_pass   = 0
total_checks           = 0

for i, case in enumerate(diabetes_cases, 1):

    print(f"\n{'='*60}")
    print(f"TEST D{i}: {case['name']}")
    print('='*60)

    result = generate_explanation(
        decision=case["decision"],
        patient=case["patient"]
    )

    print(f"\nRAG grounded:  {result['rag_grounded']}")
    print(f"Chunks used:   {result['chunks_used']}")
    print(f"Sources:       {result['sources']}")

    clinician_text = result["clinician_explanation"]
    patient_text   = result["patient_explanation"]

    print("\n─── CLINICIAN EXPLANATION ──────────────────────────")
    print(clinician_text or "⚠ EMPTY — generation failed")

    print("\n─── PATIENT EXPLANATION ────────────────────────────")
    print(patient_text or "⚠ EMPTY — generation failed")

    # Evaluate
    c_results = evaluate_clinician(clinician_text, case["name"])
    p_results = evaluate_patient(patient_text)

    print("\n─── EVALUATION ─────────────────────────────────────")
    print("Clinician checks:")
    for check, passed in c_results.items():
        icon = "✓" if passed else "✗"
        print(f"  {icon} {check}")
        if passed:
            overall_clinician_pass += 1
        total_checks += 1

    print("Patient checks:")
    for check, passed in p_results.items():
        icon = "✓" if passed else "✗"
        print(f"  {icon} {check}")
        if passed:
            overall_patient_pass += 1
        total_checks += 1

# ── Summary ─────────────────────────────────────────────────────────

total_pass = overall_clinician_pass + overall_patient_pass
print(f"\n{'='*60}")
print(f"DIABETES TEST SUMMARY")
print(f"{'='*60}")
print(f"Total checks passed: {total_pass}/{total_checks}")
print()

pass_rate = total_pass / total_checks if total_checks > 0 else 0

if pass_rate >= 0.85:
    print("VERDICT: GOOD — Ready to proceed to FastAPI integration")
    print("         Remaining failures are fine-tuning targets for Day 9")
elif pass_rate >= 0.65:
    print("VERDICT: ACCEPTABLE — Pipeline working, quality gaps identified")
    print("         Document all ✗ failures as Day 9 fine-tuning priorities")
else:
    print("VERDICT: NOT READY — Too many checks failing")
    print("         Review RAG corpus quality and prompt structure")

print()
print("Key things to check manually in the outputs above:")
print("  D1: Does MONITORING PURPOSE mention renal check BEFORE Metformin?")
print("  D2: Does TREATMENT RATIONALE explain why dose was increased to 1000mg?")
print("  D3: Does SAFETY POINTS mention hypoglycaemia education for insulin?")
print("  D4: Does output open with THIS IS A TIME-SENSITIVE EMERGENCY?")
print("  D5: Does output produce ONLY the fallback message?")
print("="*60)