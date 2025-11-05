package com.rwanda.health.cds.models;

import java.util.List;
import java.util.ArrayList;

public class ClinicalDecision {
    private String diagnosis;
    private String stage;
    private String subClassification; // Added for diabetes type (Type 1, Type 2)
    private List<String> medications; // Changed from recommendedMedications to match DRL
    private List<String> tests; // Changed from recommendedTests to match DRL
    private String patientAdvice;
    private boolean needsReferral;
    private String referralReason;
    private String confidenceLevel;

    // Constructors
    public ClinicalDecision() {
        this.medications = new ArrayList<>();
        this.tests = new ArrayList<>();
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

    public String getSubClassification() { return subClassification; }
    public void setSubClassification(String subClassification) { this.subClassification = subClassification; }

    public List<String> getMedications() { return medications; }
    public void setMedications(List<String> medications) { this.medications = medications; }

    public List<String> getTests() { return tests; }
    public void setTests(List<String> tests) { this.tests = tests; }

    public String getPatientAdvice() { return patientAdvice; }
    public void setPatientAdvice(String patientAdvice) { this.patientAdvice = patientAdvice; }

    public boolean isNeedsReferral() { return needsReferral; }
    public void setNeedsReferral(boolean needsReferral) { this.needsReferral = needsReferral; }

    public String getReferralReason() { return referralReason; }
    public void setReferralReason(String referralReason) { this.referralReason = referralReason; }

    public String getConfidenceLevel() { return confidenceLevel; }
    public void setConfidenceLevel(String confidenceLevel) { this.confidenceLevel = confidenceLevel; }

    // Helper methods
    public void addMedication(String medication) {
        if (this.medications == null) {
            this.medications = new ArrayList<>();
        }
        this.medications.add(medication);
    }

    public void addTest(String test) {
        if (this.tests == null) {
            this.tests = new ArrayList<>();
        }
        this.tests.add(test);
    }

    public void removeMedication(String medication) {
        if (this.medications != null) {
            this.medications.remove(medication);
        }
    }

    public boolean containsMedication(String medication) {
        if (this.medications == null) return false;
        return this.medications.stream()
                .anyMatch(med -> med.toLowerCase().contains(medication.toLowerCase()));
    }

    @Override
    public String toString() {
        return "ClinicalDecision{" +
                "diagnosis='" + diagnosis + '\'' +
                ", stage='" + stage + '\'' +
                ", subClassification='" + subClassification + '\'' +
                ", medications=" + medications +
                ", tests=" + tests +
                ", patientAdvice='" + patientAdvice + '\'' +
                ", needsReferral=" + needsReferral +
                ", referralReason='" + referralReason + '\'' +
                ", confidenceLevel='" + confidenceLevel + '\'' +
                '}';
    }
}