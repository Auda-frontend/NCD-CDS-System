package com.rwanda.health.cds.models;

import java.util.List;
import java.util.ArrayList;

public class PatientData {
    private PatientDemographics demographics;
    private Consultation consultation;
    private MedicalHistory medicalHistory;
    private SocialHistory socialHistory;
    private PhysicalExamination physicalExamination;
    private List<ClinicalDecision> decisions;
    
    // Constructors
    public PatientData() {
        this.decisions = new ArrayList<>();
    }
    
    public PatientData(PatientDemographics demographics, Consultation consultation, 
                      MedicalHistory medicalHistory, SocialHistory socialHistory, 
                      PhysicalExamination physicalExamination) {
        this();
        this.demographics = demographics;
        this.consultation = consultation;
        this.medicalHistory = medicalHistory;
        this.socialHistory = socialHistory;
        this.physicalExamination = physicalExamination;
    }
    
    // Getters and Setters
    public PatientDemographics getDemographics() { return demographics; }
    public void setDemographics(PatientDemographics demographics) { this.demographics = demographics; }
    
    public Consultation getConsultation() { return consultation; }
    public void setConsultation(Consultation consultation) { this.consultation = consultation; }
    
    public MedicalHistory getMedicalHistory() { return medicalHistory; }
    public void setMedicalHistory(MedicalHistory medicalHistory) { this.medicalHistory = medicalHistory; }
    
    public SocialHistory getSocialHistory() { return socialHistory; }
    public void setSocialHistory(SocialHistory socialHistory) { this.socialHistory = socialHistory; }
    
    public PhysicalExamination getPhysicalExamination() { return physicalExamination; }
    public void setPhysicalExamination(PhysicalExamination physicalExamination) { this.physicalExamination = physicalExamination; }
    
    public List<ClinicalDecision> getDecisions() { return decisions; }
    public void setDecisions(List<ClinicalDecision> decisions) { this.decisions = decisions; }
    
    public void addDecision(ClinicalDecision decision) {
        this.decisions.add(decision);
    }
}