package com.rwanda.health.cds;

import com.rwanda.health.cds.models.*;
import com.rwanda.health.cds.services.DroolsRuleService;

public class TestDroolsSetup {
    public static void main(String[] args) {
        System.out.println("Testing Hypertension Rules with Multiple Patient Scenarios...");
        System.out.println("=============================================================\n");
        
        // Test Case 1: Grade 2 Hypertension
        testGrade2Hypertension();
        
        // Test Case 2: Normal Blood Pressure
        testNormalBloodPressure();
        
        // Test Case 3: Grade 1 Hypertension with Diabetes
        testGrade1HypertensionWithDiabetes();
        
        // Test Case 4: Hypertensive Emergency
        testHypertensiveEmergency();
        
        // Test Case 5: Hypertension in Pregnancy
        testHypertensionInPregnancy();
        
        // Test Case 6: Hypertension with CKD
        testHypertensionWithCKD();
    }
    
    private static void testGrade2Hypertension() {
        System.out.println("=== TEST 1: Grade 2 Hypertension ===");
        
        PatientDemographics demographics = new PatientDemographics();
        demographics.setPatientId("HLC-PAT-2025-142488");
        demographics.setFullName("Test Patient - Grade 2 HTN");
        demographics.setGender("Male");
        demographics.setAge(45);
        
        PhysicalExamination physicalExam = new PhysicalExamination();
        physicalExam.setSystole(165.0);  // Grade 2 Hypertension
        physicalExam.setDiastole(102.0); // Grade 2 Hypertension
        
        MedicalHistory medicalHistory = new MedicalHistory();
        medicalHistory.setDiabetes(false);
        medicalHistory.setChronicKidneyDisease(false);
        medicalHistory.setCad(false);
        medicalHistory.setPregnant(false);
        
        Consultation consultation = new Consultation();
        consultation.setChiefComplaint("Headache and dizziness");
        
        SocialHistory socialHistory = new SocialHistory();
        socialHistory.setTobaccoUse(true);
        socialHistory.setAlcoholUse(false);
        
        PatientData patientData = new PatientData(
            demographics, consultation, medicalHistory, socialHistory, physicalExam
        );
        
        evaluateAndPrintResults(patientData);
    }
    
    private static void testNormalBloodPressure() {
        System.out.println("=== TEST 2: Normal Blood Pressure ===");
        
        PatientDemographics demographics = new PatientDemographics();
        demographics.setPatientId("HLC-PAT-2025-142489");
        demographics.setFullName("Test Patient - Normal BP");
        demographics.setGender("Female");
        demographics.setAge(35);
        
        PhysicalExamination physicalExam = new PhysicalExamination();
        physicalExam.setSystole(120.0);  // Normal
        physicalExam.setDiastole(80.0);  // Normal
        
        MedicalHistory medicalHistory = new MedicalHistory();
        
        Consultation consultation = new Consultation();
        consultation.setChiefComplaint("Routine checkup");
        
        SocialHistory socialHistory = new SocialHistory();
        
        PatientData patientData = new PatientData(
            demographics, consultation, medicalHistory, socialHistory, physicalExam
        );
        
        evaluateAndPrintResults(patientData);
    }
    
    private static void testGrade1HypertensionWithDiabetes() {
        System.out.println("=== TEST 3: Grade 1 Hypertension with Diabetes ===");
        
        PatientDemographics demographics = new PatientDemographics();
        demographics.setPatientId("HLC-PAT-2025-142490");
        demographics.setFullName("Test Patient - Grade 1 HTN + Diabetes");
        demographics.setGender("Male");
        demographics.setAge(55);
        
        PhysicalExamination physicalExam = new PhysicalExamination();
        physicalExam.setSystole(145.0);  // Grade 1 Hypertension
        physicalExam.setDiastole(92.0);  // Grade 1 Hypertension
        physicalExam.setBmi(28.7);
        physicalExam.setBmiStatus("Overweight");
        
        MedicalHistory medicalHistory = new MedicalHistory();
        medicalHistory.setDiabetes(true);  // Key comorbidity
        medicalHistory.setChronicKidneyDisease(false);
        medicalHistory.setCad(false);
        
        Consultation consultation = new Consultation();
        consultation.setChiefComplaint("High blood pressure and elevated sugar levels");
        
        SocialHistory socialHistory = new SocialHistory();
        
        PatientData patientData = new PatientData(
            demographics, consultation, medicalHistory, socialHistory, physicalExam
        );
        
        evaluateAndPrintResults(patientData);
    }
    
    private static void testHypertensiveEmergency() {
        System.out.println("=== TEST 4: Hypertensive Emergency ===");
        
        PatientDemographics demographics = new PatientDemographics();
        demographics.setPatientId("HLC-PAT-2025-142491");
        demographics.setFullName("Test Patient - Hypertensive Emergency");
        demographics.setGender("Female");
        demographics.setAge(62);
        
        PhysicalExamination physicalExam = new PhysicalExamination();
        physicalExam.setSystole(210.0);  // Hypertensive emergency
        physicalExam.setDiastole(130.0); // Hypertensive emergency
        
        MedicalHistory medicalHistory = new MedicalHistory();
        medicalHistory.setHypertension(true);
        medicalHistory.setDiabetes(false);
        
        Consultation consultation = new Consultation();
        consultation.setChiefComplaint("Severe headache, blurred vision, chest pain");
        
        SocialHistory socialHistory = new SocialHistory();
        
        PatientData patientData = new PatientData(
            demographics, consultation, medicalHistory, socialHistory, physicalExam
        );
        
        evaluateAndPrintResults(patientData);
    }
    
    private static void testHypertensionInPregnancy() {
        System.out.println("=== TEST 5: Hypertension in Pregnancy ===");
        
        PatientDemographics demographics = new PatientDemographics();
        demographics.setPatientId("HLC-PAT-2025-142492");
        demographics.setFullName("Test Patient - Pregnant with HTN");
        demographics.setGender("Female");
        demographics.setAge(28);
        
        PhysicalExamination physicalExam = new PhysicalExamination();
        physicalExam.setSystole(150.0);  // Hypertension
        physicalExam.setDiastole(95.0);  // Hypertension
        
        MedicalHistory medicalHistory = new MedicalHistory();
        medicalHistory.setPregnant(true);  // Key factor
        medicalHistory.setHypertension(true);
        
        Consultation consultation = new Consultation();
        consultation.setChiefComplaint("High blood pressure during pregnancy");
        
        SocialHistory socialHistory = new SocialHistory();
        
        PatientData patientData = new PatientData(
            demographics, consultation, medicalHistory, socialHistory, physicalExam
        );
        
        evaluateAndPrintResults(patientData);
    }
    
    private static void testHypertensionWithCKD() {
        System.out.println("=== TEST 6: Hypertension with Chronic Kidney Disease ===");
        
        PatientDemographics demographics = new PatientDemographics();
        demographics.setPatientId("HLC-PAT-2025-142493");
        demographics.setFullName("Test Patient - HTN + CKD");
        demographics.setGender("Male");
        demographics.setAge(68);
        
        PhysicalExamination physicalExam = new PhysicalExamination();
        physicalExam.setSystole(155.0);  // Grade 1-2 Hypertension
        physicalExam.setDiastole(98.0);  // Grade 1-2 Hypertension
        
        MedicalHistory medicalHistory = new MedicalHistory();
        medicalHistory.setChronicKidneyDisease(true);  // Key comorbidity
        medicalHistory.setDiabetes(false);
        medicalHistory.setHyperkalemia(false);
        
        Consultation consultation = new Consultation();
        consultation.setChiefComplaint("High blood pressure and kidney issues");
        
        SocialHistory socialHistory = new SocialHistory();
        
        PatientData patientData = new PatientData(
            demographics, consultation, medicalHistory, socialHistory, physicalExam
        );
        
        evaluateAndPrintResults(patientData);
    }
    
    private static void evaluateAndPrintResults(PatientData patientData) {
        DroolsRuleService ruleService = new DroolsRuleService();
        PatientData result = ruleService.evaluatePatient(patientData);
        
        System.out.println("Patient: " + result.getDemographics().getFullName());
        System.out.println("BP: " + result.getPhysicalExamination().getSystole() + 
                          "/" + result.getPhysicalExamination().getDiastole() + " mmHg");
        System.out.println("Age: " + result.getDemographics().getAge());
        System.out.println("Number of clinical decisions: " + result.getDecisions().size());
        
        for (ClinicalDecision decision : result.getDecisions()) {
            System.out.println("\n--- CLINICAL DECISION ---");
            System.out.println("Diagnosis: " + decision.getDiagnosis());
            System.out.println("Stage: " + decision.getStage());
            System.out.println("Medications: " + decision.getRecommendedMedications());
            System.out.println("Recommended Tests: " + decision.getRecommendedTests());
            System.out.println("Referral Needed: " + decision.isNeedsReferral());
            if (decision.isNeedsReferral()) {
                System.out.println("Referral Reason: " + decision.getReferralReason());
            }
            System.out.println("Patient Advice: " + decision.getPatientAdvice());
            System.out.println("Confidence Level: " + decision.getConfidenceLevel());
        }
        
        System.out.println("\n" + "=" .repeat(50) + "\n");
    }
}