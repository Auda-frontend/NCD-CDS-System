package com.rwanda.health.cds.models;

import java.util.List;
import java.util.ArrayList;

public class ClinicalDecision {
    private String diagnosis;
    private String stage;
    private List<String> recommendedMedications;
    private List<String> recommendedTests;
    private String patientAdvice;
    private boolean needsReferral;
    private String referralReason;
    private String confidenceLevel;
    
    // Constructors
    public ClinicalDecision() {
        this.recommendedMedications = new ArrayList<>();
        this.recommendedTests = new ArrayList<>();
    }
    
    public ClinicalDecision(String diagnosis, String stage) {
        this();
        this.diagnosis = diagnosis;
        this.stage = stage;
    }
    
    // Getters and Setters
    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
    
    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }
    
    public List<String> getRecommendedMedications() { return recommendedMedications; }
    public void setRecommendedMedications(List<String> recommendedMedications) { this.recommendedMedications = recommendedMedications; }
    
    public List<String> getRecommendedTests() { return recommendedTests; }
    public void setRecommendedTests(List<String> recommendedTests) { this.recommendedTests = recommendedTests; }
    
    public String getPatientAdvice() { return patientAdvice; }
    public void setPatientAdvice(String patientAdvice) { this.patientAdvice = patientAdvice; }
    
    public boolean isNeedsReferral() { return needsReferral; }
    public void setNeedsReferral(boolean needsReferral) { this.needsReferral = needsReferral; }
    
    public String getReferralReason() { return referralReason; }
    public void setReferralReason(String referralReason) { this.referralReason = referralReason; }
    
    public String getConfidenceLevel() { return confidenceLevel; }
    public void setConfidenceLevel(String confidenceLevel) { this.confidenceLevel = confidenceLevel; }
    
    public void addMedication(String medication) {
        this.recommendedMedications.add(medication);
    }
    
    public void addTest(String test) {
        this.recommendedTests.add(test);
    }
}