import subprocess
import json
import tempfile
import os
from typing import Dict, Any, List
import time
from ..models.patient_models import PatientData, ClinicalDecision, CDSResponse

class DroolsIntegrationService:
    def __init__(self, drools_jar_path: str = None):
        self.drools_jar_path = drools_jar_path or self._find_drools_jar()
    
    def _find_drools_jar(self) -> str:
        """Find the Drools JAR file in the project structure"""
        # Look for the built JAR in the drools-engine target directory
        potential_paths = [
            "../drools-engine/target/clinical-cds-drools-1.0.0.jar",
            "./drools-engine/target/clinical-cds-drools-1.0.0.jar",
            "clinical-cds-drools-1.0.0.jar"
        ]
        
        for path in potential_paths:
            if os.path.exists(path):
                return os.path.abspath(path)
        
        raise FileNotFoundError("Drools JAR file not found. Please build the Java project first.")
    
    def _convert_to_java_input(self, patient_data: PatientData) -> Dict[str, Any]:
        """Convert Python Pydantic model to Java-compatible JSON"""
        java_input = {
            "demographics": {
                "patientId": patient_data.demographics.patient_id,
                "upid": patient_data.demographics.upid,
                "fullName": patient_data.demographics.full_name,
                "gender": patient_data.demographics.gender.value,
                "age": patient_data.demographics.age,
                "province": patient_data.demographics.province,
                "district": patient_data.demographics.district,
                "sector": patient_data.demographics.sector,
                "cell": patient_data.demographics.cell,
                "village": patient_data.demographics.village
            },
            "consultation": {
                "practitionerName": patient_data.consultation.practitioner_name,
                "consultationType": patient_data.consultation.consultation_type.value if patient_data.consultation.consultation_type else None,
                "chiefComplaint": patient_data.consultation.chief_complaint,
                "patientReferredFrom": patient_data.consultation.patient_referred_from
            },
            "medicalHistory": {
                "hypertension": patient_data.medical_history.hypertension,
                "diabetes": patient_data.medical_history.diabetes,
                "chronicKidneyDisease": patient_data.medical_history.chronic_kidney_disease,
                "asthma": patient_data.medical_history.asthma,
                "copd": patient_data.medical_history.copd,
                "tonsilitis": patient_data.medical_history.tonsilitis,
                "overweight": patient_data.medical_history.overweight,
                "undernutrition": patient_data.medical_history.undernutrition,
                "cad": patient_data.medical_history.cad,
                "hyperkalemia": patient_data.medical_history.hyperkalemia,
                "pregnant": patient_data.medical_history.pregnant,
                "strokeHistory": patient_data.medical_history.stroke_history,
                "heartFailure": patient_data.medical_history.heart_failure,
                "currentMedications": patient_data.medical_history.current_medications,
                "medicationAllergies": patient_data.medical_history.medication_allergies,
                "formerSmoker": patient_data.medical_history.former_smoker,
                "currentSmoker": patient_data.medical_history.current_smoker,
                "formerAlcohol": patient_data.medical_history.former_alcohol,
                "currentAlcohol": patient_data.medical_history.current_alcohol,
                
                # Diabetes-specific fields
                "diabetesSymptoms": patient_data.medical_history.diabetes_symptoms,
                "diabetesOnset": patient_data.medical_history.diabetes_onset.value if patient_data.medical_history.diabetes_onset else None,
                "ketoacidosisHistory": patient_data.medical_history.ketoacidosis_history,
                "autoimmuneDisease": patient_data.medical_history.autoimmune_disease,
                "obesity": patient_data.medical_history.obesity,
                "familyHistoryDiabetes": patient_data.medical_history.family_history_diabetes,
                "historyGDM": patient_data.medical_history.history_gdm,
                "renalImpairment": patient_data.medical_history.renal_impairment,
                "liverDisease": patient_data.medical_history.liver_disease,
                "cardiovascularDisease": patient_data.medical_history.cardiovascular_disease,
                "neuropathySymptoms": patient_data.medical_history.neuropathy_symptoms,
                "persistentProteinuria": patient_data.medical_history.persistent_proteinuria,
                "cardiovascularRiskFactors": patient_data.medical_history.cardiovascular_risk_factors,
                "abdominalPain": patient_data.medical_history.abdominal_pain,
                "nauseaVomiting": patient_data.medical_history.nausea_vomiting,
                "dehydration": patient_data.medical_history.dehydration,
                "rapidBreathing": patient_data.medical_history.rapid_breathing,
                "dangerSigns": patient_data.medical_history.danger_signs,
                "treatmentDuration": patient_data.medical_history.treatment_duration,
                "hivPositive": patient_data.medical_history.hiv_positive
            },
            "socialHistory": {
                "tobaccoUse": patient_data.social_history.tobacco_use,
                "alcoholUse": patient_data.social_history.alcohol_use
            },
            "physicalExamination": {
                "systole": patient_data.physical_examination.systole,
                "diastole": patient_data.physical_examination.diastole,
                "bpStatus": patient_data.physical_examination.bp_status,
                "height": patient_data.physical_examination.height,
                "weight": patient_data.physical_examination.weight,
                "bmi": patient_data.physical_examination.bmi,
                "bmiStatus": patient_data.physical_examination.bmi_status,
                "pulse": patient_data.physical_examination.pulse,
                "temperature": patient_data.physical_examination.temperature,
                "spO2": patient_data.physical_examination.spO2,
                "painScore": patient_data.physical_examination.pain_score
            }
        }
        
        # Add investigations if available
        if patient_data.investigations:
            java_input["investigations"] = {
                "hba1c": patient_data.investigations.hba1c,
                "fastingGlucose": patient_data.investigations.fasting_glucose,
                "randomGlucose": patient_data.investigations.random_glucose,
                "bloodGlucose": patient_data.investigations.blood_glucose,
                "egfr": patient_data.investigations.egfr,
                "ketonuria": patient_data.investigations.ketonuria,
                "urineProtein": patient_data.investigations.urine_protein,
                "serumCreatinine": patient_data.investigations.serum_creatinine,
                "ldlCholesterol": patient_data.investigations.ldl_cholesterol,
                "additionalTests": patient_data.investigations.additional_tests
            }

        # Optional previous-visit history for longitudinal HTN logic
        history: Dict[str, Any] = {}
        if getattr(patient_data, "previous_systole", None) is not None:
            history["previousSystole"] = patient_data.previous_systole
        if getattr(patient_data, "previous_diastole", None) is not None:
            history["previousDiastole"] = patient_data.previous_diastole
        if getattr(patient_data, "previous_visit_date", None) is not None:
            history["previousVisitDate"] = patient_data.previous_visit_date.isoformat()
        if history:
            java_input["history"] = history
        
        return java_input
    
    def _convert_from_java_output(self, java_output: Dict[str, Any]) -> List[ClinicalDecision]:
        """Convert Java JSON output back to Python ClinicalDecision objects"""
        decisions = []
        
        if "decisions" in java_output:
            for decision_data in java_output["decisions"]:
                decision = ClinicalDecision(
                    diagnosis=decision_data.get("diagnosis"),
                    stage=decision_data.get("stage"),
                    sub_classification=decision_data.get("subClassification"),  # Added for diabetes type
                    medications=decision_data.get("medications", []),  # Updated field name
                    tests=decision_data.get("tests", []),  # Updated field name
                    patient_advice=decision_data.get("patientAdvice"),
                    needs_referral=decision_data.get("needsReferral", False),
                    referral_reason=decision_data.get("referralReason"),
                    confidence_level=decision_data.get("confidenceLevel")
                )
                decisions.append(decision)
        
        return decisions
    
    def evaluate_patient(self, patient_data: PatientData) -> CDSResponse:
        """Evaluate patient data using Drools rules engine"""
        start_time = time.time()
        
        try:
            # Convert to Java-compatible input
            java_input = self._convert_to_java_input(patient_data)
            
            # Create temporary input file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as input_file:
                json.dump(java_input, input_file, indent=2)
                input_file_path = input_file.name
            
            # Create temporary output file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as output_file:
                output_file_path = output_file.name
            
            # Build Java command
            java_command = [
                "java",
                "-jar",
                self.drools_jar_path,
                input_file_path,
                output_file_path
            ]
            
            # Execute Java program
            result = subprocess.run(
                java_command,
                capture_output=True,
                text=True,
                timeout=30  # 30 second timeout
            )
            
            if result.returncode != 0:
                raise Exception(f"Java execution failed: {result.stderr}")
            
            # Read and parse output
            with open(output_file_path, 'r') as f:
                java_output = json.load(f)
            
            # Convert back to Python objects
            decisions = self._convert_from_java_output(java_output)
            
            execution_time = (time.time() - start_time) * 1000  # Convert to milliseconds
            
            return CDSResponse(
                success=True,
                message="Clinical decision support evaluation completed successfully",
                clinical_decisions=decisions,
                patient_data=patient_data,
                execution_time_ms=execution_time
            )
            
        except Exception as e:
            execution_time = (time.time() - start_time) * 1000
            return CDSResponse(
                success=False,
                message=f"Error during evaluation: {str(e)}",
                clinical_decisions=[],
                patient_data=patient_data,
                execution_time_ms=execution_time
            )
        
        finally:
            # Clean up temporary files
            try:
                if 'input_file_path' in locals():
                    os.unlink(input_file_path)
                if 'output_file_path' in locals():
                    os.unlink(output_file_path)
            except:
                pass  # Ignore cleanup errors

    def test_connection(self) -> bool:
        """Test if the Drools integration is working"""
        try:
            # Create a simple test patient
            from ..models.patient_models import create_sample_hypertension_patient
            test_patient = create_sample_hypertension_patient()
            
            # Try to evaluate
            response = self.evaluate_patient(test_patient)
            return response.success
            
        except Exception as e:
            print(f"Connection test failed: {e}")
            return False

    def batch_evaluate_patients(self, patient_list: List[PatientData]) -> List[CDSResponse]:
        """Evaluate multiple patients in batch"""
        responses = []
        for patient in patient_list:
            response = self.evaluate_patient(patient)
            responses.append(response)
        return responses