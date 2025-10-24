package com.rwanda.health.cds;

import com.rwanda.health.cds.models.*;
import com.rwanda.health.cds.services.DroolsRuleService;

public class GuaranteedTest {
    public static void main(String[] args) {
        System.out.println("🧪 Guaranteed Drools Test");

        try {
            // Create test patient
            PatientDemographics demographics = new PatientDemographics();
            demographics.setFullName("Test Patient");
            demographics.setGender("Male");
            demographics.setAge(45);

            PhysicalExamination physicalExam = new PhysicalExamination();
            physicalExam.setSystole(165.0);
            physicalExam.setDiastole(102.0);

            PatientData patientData = new PatientData(
                    demographics, new Consultation(), new MedicalHistory(), new SocialHistory(), physicalExam
            );

            System.out.println("🔄 Initializing Drools...");
            DroolsRuleService service = new DroolsRuleService();

            System.out.println("🔄 Evaluating patient...");
            PatientData result = service.evaluatePatient(patientData);

            System.out.println("✅ SUCCESS! Evaluation completed!");
            System.out.println("Decisions: " + result.getDecisions().size());

            for (ClinicalDecision decision : result.getDecisions()) {
                System.out.println("  - " + decision.getDiagnosis() + " (" + decision.getStage() + ")");
            }

        } catch (Exception e) {
            System.err.println("❌ Test failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
}