package com.rwanda.health.cds;

import com.rwanda.health.cds.models.*;
import com.rwanda.health.cds.services.DroolsRuleService;

public class GuaranteedTest {
    public static void main(String[] args) {
        System.out.println("🧪 Guaranteed Drools Test - Hypertension & Diabetes");

        try {
            // Test Case 1: Hypertension Patient
            System.out.println("\n=== TEST CASE 1: HYPERTENSION PATIENT ===");
            testHypertensionPatient();

            // Test Case 2: Diabetes Patient
            System.out.println("\n=== TEST CASE 2: DIABETES PATIENT ===");
            testDiabetesPatient();

            // Test Case 3: Patient with Both Conditions
            System.out.println("\n=== TEST CASE 3: HYPERTENSION + DIABETES PATIENT ===");
            testHypertensionDiabetesPatient();

        } catch (Exception e) {
            System.err.println("❌ Test failed: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void testHypertensionPatient() {
        // Create hypertension test patient
        PatientDemographics demographics = new PatientDemographics();
        demographics.setFullName("Hypertension Test Patient");
        demographics.setGender("Male");
        demographics.setAge(45);

        PhysicalExamination physicalExam = new PhysicalExamination();
        physicalExam.setSystole(165.0);
        physicalExam.setDiastole(102.0);

        MedicalHistory medicalHistory = new MedicalHistory();
        medicalHistory.setHypertension(true);
        medicalHistory.setOverweight(true);

        SocialHistory socialHistory = new SocialHistory();
        Investigations investigations = new Investigations();
        Consultation consultation = new Consultation();

        // Create patient data with all required parameters
        PatientData patientData = new PatientData();
        patientData.setDemographics(demographics);
        patientData.setPhysicalExamination(physicalExam);
        patientData.setMedicalHistory(medicalHistory);
        patientData.setSocialHistory(socialHistory);
        patientData.setInvestigations(investigations);
        patientData.setConsultation(consultation);

        System.out.println("🔄 Evaluating hypertension patient...");
        DroolsRuleService service = new DroolsRuleService();
        PatientData result = service.evaluatePatient(patientData);

        System.out.println("✅ Hypertension Evaluation completed!");
        System.out.println("Decisions: " + result.getDecisions().size());

        for (ClinicalDecision decision : result.getDecisions()) {
            System.out.println("  - Diagnosis: " + decision.getDiagnosis() + " (" + decision.getStage() + ")");
            if (decision.getMedications() != null && !decision.getMedications().isEmpty()) {
                System.out.println("    Medications: " + decision.getMedications());
            }
            if (decision.getTests() != null && !decision.getTests().isEmpty()) {
                System.out.println("    Tests: " + decision.getTests());
            }
        }
    }

    private static void testDiabetesPatient() {
        // Create diabetes test patient
        PatientDemographics demographics = new PatientDemographics();
        demographics.setFullName("Diabetes Test Patient");
        demographics.setGender("Female");
        demographics.setAge(52);

        PhysicalExamination physicalExam = new PhysicalExamination();
        physicalExam.setSystole(125.0);
        physicalExam.setDiastole(82.0);

        MedicalHistory medicalHistory = new MedicalHistory();
        medicalHistory.setDiabetes(true);
        medicalHistory.setDiabetesSymptoms(true);
        medicalHistory.setDiabetesOnset("gradual");
        medicalHistory.setObesity(true);
        medicalHistory.setFamilyHistoryDiabetes(true);
        medicalHistory.setOverweight(true);

        SocialHistory socialHistory = new SocialHistory();
        Consultation consultation = new Consultation();

        // Create comprehensive investigations for diabetes
        Investigations investigations = new Investigations();
        investigations.setHba1c(8.7); // Poor control
        investigations.setFastingGlucose(9.8);
        investigations.setRandomGlucose(15.2);
        investigations.setEgfr(68.0);

        // Create patient data using setter methods
        PatientData patientData = new PatientData();
        patientData.setDemographics(demographics);
        patientData.setPhysicalExamination(physicalExam);
        patientData.setMedicalHistory(medicalHistory);
        patientData.setSocialHistory(socialHistory);
        patientData.setInvestigations(investigations);
        patientData.setConsultation(consultation);

        System.out.println("🔄 Evaluating diabetes patient...");
        DroolsRuleService service = new DroolsRuleService();
        PatientData result = service.evaluatePatient(patientData);

        System.out.println("✅ Diabetes Evaluation completed!");
        System.out.println("Decisions: " + result.getDecisions().size());

        for (ClinicalDecision decision : result.getDecisions()) {
            System.out.println("  - Diagnosis: " + decision.getDiagnosis() +
                    " | Stage: " + decision.getStage() +
                    " | Type: " + decision.getSubClassification());
            if (decision.getMedications() != null && !decision.getMedications().isEmpty()) {
                System.out.println("    Medications: " + decision.getMedications());
            }
            if (decision.getTests() != null && !decision.getTests().isEmpty()) {
                System.out.println("    Tests: " + decision.getTests());
            }
            if (decision.isNeedsReferral()) {
                System.out.println("    Referral: " + decision.getReferralReason());
            }
        }
    }

    private static void testHypertensionDiabetesPatient() {
        // Create patient with both conditions
        PatientDemographics demographics = new PatientDemographics();
        demographics.setFullName("Hypertension + Diabetes Test Patient");
        demographics.setGender("Female");
        demographics.setAge(58);

        PhysicalExamination physicalExam = new PhysicalExamination();
        physicalExam.setSystole(148.0);
        physicalExam.setDiastole(96.0);

        MedicalHistory medicalHistory = new MedicalHistory();
        medicalHistory.setHypertension(true);
        medicalHistory.setDiabetes(true);
        medicalHistory.setDiabetesSymptoms(true);
        medicalHistory.setDiabetesOnset("gradual");
        medicalHistory.setObesity(true);
        medicalHistory.setFamilyHistoryDiabetes(true);
        medicalHistory.setOverweight(true);
        medicalHistory.setChronicKidneyDisease(true);

        SocialHistory socialHistory = new SocialHistory();
        Consultation consultation = new Consultation();

        // Create comprehensive investigations
        Investigations investigations = new Investigations();
        investigations.setHba1c(7.9);
        investigations.setFastingGlucose(8.5);
        investigations.setRandomGlucose(12.8);
        investigations.setEgfr(52.0); // CKD stage 3

        // Create patient data using setter methods
        PatientData patientData = new PatientData();
        patientData.setDemographics(demographics);
        patientData.setPhysicalExamination(physicalExam);
        patientData.setMedicalHistory(medicalHistory);
        patientData.setSocialHistory(socialHistory);
        patientData.setInvestigations(investigations);
        patientData.setConsultation(consultation);

        System.out.println("🔄 Evaluating hypertension + diabetes patient...");
        DroolsRuleService service = new DroolsRuleService();
        PatientData result = service.evaluatePatient(patientData);

        System.out.println("✅ Combined Evaluation completed!");
        System.out.println("Decisions: " + result.getDecisions().size());

        for (ClinicalDecision decision : result.getDecisions()) {
            System.out.println("  - Diagnosis: " + decision.getDiagnosis() +
                    " | Stage: " + decision.getStage() +
                    " | Type: " + decision.getSubClassification());
            if (decision.getMedications() != null && !decision.getMedications().isEmpty()) {
                System.out.println("    Medications: " + decision.getMedications());
            }
            if (decision.getTests() != null && !decision.getTests().isEmpty()) {
                System.out.println("    Tests: " + decision.getTests());
            }
            if (decision.getPatientAdvice() != null) {
                System.out.println("    Advice: " + decision.getPatientAdvice());
            }
        }
    }
}