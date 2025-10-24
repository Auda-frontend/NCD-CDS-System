package com.rwanda.health.cds;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rwanda.health.cds.models.*;
import com.rwanda.health.cds.services.DroolsRuleService;

import java.io.File;
// import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class DroolsJsonRunner {
    private static final ObjectMapper objectMapper = new ObjectMapper();
    
    public static void main(String[] args) {
        if (args.length < 2) {
            System.err.println("Usage: java DroolsJsonRunner <input.json> <output.json>");
            System.exit(1);
        }
        
        String inputFile = args[0];
        String outputFile = args[1];
        
        try {
            // Read input JSON
            Map<String, Object> inputData = objectMapper.readValue(new File(inputFile), Map.class);
            
            // Convert to Java objects
            PatientData patientData = convertToPatientData(inputData);
            
            // Evaluate with Drools
            DroolsRuleService ruleService = new DroolsRuleService();
            PatientData result = ruleService.evaluatePatient(patientData);
            
            // Convert to output format
            Map<String, Object> outputData = convertToOutputFormat(result);
            
            // Write output JSON
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(new File(outputFile), outputData);
            
            System.out.println("Evaluation completed successfully");
            
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
    
    private static PatientData convertToPatientData(Map<String, Object> inputData) {
        PatientData patientData = new PatientData();
        
        // Convert demographics
        if (inputData.containsKey("demographics")) {
            Map<String, Object> demoMap = (Map<String, Object>) inputData.get("demographics");
            PatientDemographics demographics = new PatientDemographics();
            demographics.setPatientId((String) demoMap.get("patientId"));
            demographics.setUpid((String) demoMap.get("upid"));
            demographics.setFullName((String) demoMap.get("fullName"));
            demographics.setGender((String) demoMap.get("gender"));
            demographics.setAge(((Number) demoMap.get("age")).intValue());
            demographics.setProvince((String) demoMap.get("province"));
            demographics.setDistrict((String) demoMap.get("district"));
            demographics.setSector((String) demoMap.get("sector"));
            demographics.setCell((String) demoMap.get("cell"));
            demographics.setVillage((String) demoMap.get("village"));
            patientData.setDemographics(demographics);
        }
        
        // Convert consultation
        if (inputData.containsKey("consultation")) {
            Map<String, Object> consMap = (Map<String, Object>) inputData.get("consultation");
            Consultation consultation = new Consultation();
            consultation.setPractitionerName((String) consMap.get("practitionerName"));
            consultation.setConsultationType((String) consMap.get("consultationType"));
            consultation.setChiefComplaint((String) consMap.get("chiefComplaint"));
            patientData.setConsultation(consultation);
        }
        
        // Convert medical history
        if (inputData.containsKey("medicalHistory")) {
            Map<String, Object> medMap = (Map<String, Object>) inputData.get("medicalHistory");
            MedicalHistory medicalHistory = new MedicalHistory();
            medicalHistory.setHypertension((Boolean) medMap.get("hypertension"));
            medicalHistory.setDiabetes((Boolean) medMap.get("diabetes"));
            medicalHistory.setChronicKidneyDisease((Boolean) medMap.get("chronicKidneyDisease"));
            medicalHistory.setCad((Boolean) medMap.get("cad"));
            medicalHistory.setHyperkalemia((Boolean) medMap.get("hyperkalemia"));
            medicalHistory.setPregnant((Boolean) medMap.get("pregnant"));
            // Add other fields as needed...
            patientData.setMedicalHistory(medicalHistory);
        }
        
        // Convert social history
        if (inputData.containsKey("socialHistory")) {
            Map<String, Object> socialMap = (Map<String, Object>) inputData.get("socialHistory");
            SocialHistory socialHistory = new SocialHistory();
            socialHistory.setTobaccoUse((Boolean) socialMap.get("tobaccoUse"));
            socialHistory.setAlcoholUse((Boolean) socialMap.get("alcoholUse"));
            patientData.setSocialHistory(socialHistory);
        }
        
        // Convert physical examination
        if (inputData.containsKey("physicalExamination")) {
            Map<String, Object> physMap = (Map<String, Object>) inputData.get("physicalExamination");
            PhysicalExamination physicalExam = new PhysicalExamination();
            
            Object systole = physMap.get("systole");
            if (systole != null) {
                physicalExam.setSystole(((Number) systole).doubleValue());
            }
            
            Object diastole = physMap.get("diastole");
            if (diastole != null) {
                physicalExam.setDiastole(((Number) diastole).doubleValue());
            }
            
            physicalExam.setBpStatus((String) physMap.get("bpStatus"));
            
            // Add other fields as needed...
            patientData.setPhysicalExamination(physicalExam);
        }
        
        return patientData;
    }
    
    private static Map<String, Object> convertToOutputFormat(PatientData result) {
        Map<String, Object> output = new HashMap<>();
        
        // Convert decisions
        java.util.List<Map<String, Object>> decisionsList = new java.util.ArrayList<>();
        for (ClinicalDecision decision : result.getDecisions()) {
            Map<String, Object> decisionMap = new HashMap<>();
            decisionMap.put("diagnosis", decision.getDiagnosis());
            decisionMap.put("stage", decision.getStage());
            decisionMap.put("recommendedMedications", decision.getRecommendedMedications());
            decisionMap.put("recommendedTests", decision.getRecommendedTests());
            decisionMap.put("patientAdvice", decision.getPatientAdvice());
            decisionMap.put("needsReferral", decision.isNeedsReferral());
            decisionMap.put("referralReason", decision.getReferralReason());
            decisionMap.put("confidenceLevel", decision.getConfidenceLevel());
            decisionsList.add(decisionMap);
        }
        
        output.put("decisions", decisionsList);
        output.put("success", true);
        output.put("message", "Evaluation completed successfully");
        
        return output;
    }
}