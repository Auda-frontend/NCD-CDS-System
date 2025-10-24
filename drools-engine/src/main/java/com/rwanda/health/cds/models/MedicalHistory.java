package com.rwanda.health.cds.models;

import java.util.List;
import java.util.ArrayList;

public class MedicalHistory {
    private boolean hypertension;
    private boolean diabetes;
    private boolean chronicKidneyDisease;
    private boolean asthma;
    private boolean copd;
    private boolean tonsilitis;
    private boolean overweight;
    private boolean undernutrition;
    private List<String> currentMedications;
    private List<String> medicationAllergies;
    private boolean formerSmoker;
    private boolean currentSmoker;
    private boolean formerAlcohol;
    private boolean currentAlcohol;
    private boolean cad; // Coronary Artery Disease
    private boolean hyperkalemia;
    private boolean pregnant;
    private boolean strokeHistory;
    private boolean heartFailure;
    
    // Constructors
    public MedicalHistory() {
        this.currentMedications = new ArrayList<>();
        this.medicationAllergies = new ArrayList<>();
    }
    
    // Getters and Setters
    public boolean isHypertension() { return hypertension; }
    public void setHypertension(boolean hypertension) { this.hypertension = hypertension; }
    
    public boolean isDiabetes() { return diabetes; }
    public void setDiabetes(boolean diabetes) { this.diabetes = diabetes; }
    
    public boolean isChronicKidneyDisease() { return chronicKidneyDisease; }
    public void setChronicKidneyDisease(boolean chronicKidneyDisease) { this.chronicKidneyDisease = chronicKidneyDisease; }
    
    public boolean isAsthma() { return asthma; }
    public void setAsthma(boolean asthma) { this.asthma = asthma; }
    
    public boolean isCopd() { return copd; }
    public void setCopd(boolean copd) { this.copd = copd; }
    
    public boolean isTonsilitis() { return tonsilitis; }
    public void setTonsilitis(boolean tonsilitis) { this.tonsilitis = tonsilitis; }
    
    public boolean isOverweight() { return overweight; }
    public void setOverweight(boolean overweight) { this.overweight = overweight; }
    
    public boolean isUndernutrition() { return undernutrition; }
    public void setUndernutrition(boolean undernutrition) { this.undernutrition = undernutrition; }
    
    public List<String> getCurrentMedications() { return currentMedications; }
    public void setCurrentMedications(List<String> currentMedications) { this.currentMedications = currentMedications; }
    
    public List<String> getMedicationAllergies() { return medicationAllergies; }
    public void setMedicationAllergies(List<String> medicationAllergies) { this.medicationAllergies = medicationAllergies; }
    
    public boolean isFormerSmoker() { return formerSmoker; }
    public void setFormerSmoker(boolean formerSmoker) { this.formerSmoker = formerSmoker; }
    
    public boolean isCurrentSmoker() { return currentSmoker; }
    public void setCurrentSmoker(boolean currentSmoker) { this.currentSmoker = currentSmoker; }
    
    public boolean isFormerAlcohol() { return formerAlcohol; }
    public void setFormerAlcohol(boolean formerAlcohol) { this.formerAlcohol = formerAlcohol; }
    
    public boolean isCurrentAlcohol() { return currentAlcohol; }

    public void setCurrentAlcohol(boolean currentAlcohol) {
        this.currentAlcohol = currentAlcohol;
    }

    public boolean isCad() { return cad; }
    public void setCad(boolean cad) { this.cad = cad; }
    
    public boolean isHyperkalemia() { return hyperkalemia; }
    public void setHyperkalemia(boolean hyperkalemia) { this.hyperkalemia = hyperkalemia; }
    
    public boolean isPregnant() { return pregnant; }
    public void setPregnant(boolean pregnant) { this.pregnant = pregnant; }
    
    public boolean isStrokeHistory() { return strokeHistory; }
    public void setStrokeHistory(boolean strokeHistory) { this.strokeHistory = strokeHistory; }
    
    public boolean isHeartFailure() { return heartFailure; }
    public void setHeartFailure(boolean heartFailure) { this.heartFailure = heartFailure; }
}
