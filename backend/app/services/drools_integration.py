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
        return {
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
                "chiefComplaint": patient_data.consultation.chief_complaint
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
                "currentAlcohol": patient_data.medical_history.current_alcohol
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
    
    def _convert_from_java_output(self, java_output: Dict[str, Any]) -> List[ClinicalDecision]:
        """Convert Java JSON output back to Python ClinicalDecision objects"""
        decisions = []
        
        if "decisions" in java_output:
            for decision_data in java_output["decisions"]:
                decision = ClinicalDecision(
                    diagnosis=decision_data.get("diagnosis"),
                    stage=decision_data.get("stage"),
                    recommended_medications=decision_data.get("recommendedMedications", []),
                    recommended_tests=decision_data.get("recommendedTests", []),
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