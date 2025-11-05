package com.rwanda.health.cds.models;

import java.util.List;
import java.util.ArrayList;

public class MedicalHistory {
    // Existing fields
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

    // Diabetes-specific fields
    private boolean diabetesSymptoms; // polyuria, polydipsia, weight loss
    private String diabetesOnset; // "acute" or "gradual"
    private boolean ketoacidosisHistory;
    private boolean autoimmuneDisease;
    private boolean obesity;
    private boolean familyHistoryDiabetes;
    private boolean historyGDM;
    private boolean renalImpairment;
    private boolean liverDisease;
    private boolean cardiovascularDisease;
    private boolean neuropathySymptoms;
    private boolean persistentProteinuria;
    private boolean cardiovascularRiskFactors;
    private boolean abdominalPain;
    private boolean nauseaVomiting;
    private boolean dehydration;
    private boolean rapidBreathing;
    private boolean dangerSigns; // dehydration, abdominal pain, hypotension, confusion
    private Integer treatmentDuration; // months
    private boolean hivPositive;

    // Constructors
    public MedicalHistory() {
        this.currentMedications = new ArrayList<>();
        this.medicationAllergies = new ArrayList<>();
    }

    // Getters and Setters for existing fields
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
    public void setCurrentAlcohol(boolean currentAlcohol) { this.currentAlcohol = currentAlcohol; }

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

    // Getters and Setters for diabetes-specific fields
    public boolean isDiabetesSymptoms() { return diabetesSymptoms; }
    public void setDiabetesSymptoms(boolean diabetesSymptoms) { this.diabetesSymptoms = diabetesSymptoms; }

    public String getDiabetesOnset() { return diabetesOnset; }
    public void setDiabetesOnset(String diabetesOnset) { this.diabetesOnset = diabetesOnset; }

    public boolean isKetoacidosisHistory() { return ketoacidosisHistory; }
    public void setKetoacidosisHistory(boolean ketoacidosisHistory) { this.ketoacidosisHistory = ketoacidosisHistory; }

    public boolean isAutoimmuneDisease() { return autoimmuneDisease; }
    public void setAutoimmuneDisease(boolean autoimmuneDisease) { this.autoimmuneDisease = autoimmuneDisease; }

    public boolean isObesity() { return obesity; }
    public void setObesity(boolean obesity) { this.obesity = obesity; }

    public boolean isFamilyHistoryDiabetes() { return familyHistoryDiabetes; }
    public void setFamilyHistoryDiabetes(boolean familyHistoryDiabetes) { this.familyHistoryDiabetes = familyHistoryDiabetes; }

    public boolean isHistoryGDM() { return historyGDM; }
    public void setHistoryGDM(boolean historyGDM) { this.historyGDM = historyGDM; }

    public boolean isRenalImpairment() { return renalImpairment; }
    public void setRenalImpairment(boolean renalImpairment) { this.renalImpairment = renalImpairment; }

    public boolean isLiverDisease() { return liverDisease; }
    public void setLiverDisease(boolean liverDisease) { this.liverDisease = liverDisease; }

    public boolean isCardiovascularDisease() { return cardiovascularDisease; }
    public void setCardiovascularDisease(boolean cardiovascularDisease) { this.cardiovascularDisease = cardiovascularDisease; }

    public boolean isNeuropathySymptoms() { return neuropathySymptoms; }
    public void setNeuropathySymptoms(boolean neuropathySymptoms) { this.neuropathySymptoms = neuropathySymptoms; }

    public boolean isPersistentProteinuria() { return persistentProteinuria; }
    public void setPersistentProteinuria(boolean persistentProteinuria) { this.persistentProteinuria = persistentProteinuria; }

    public boolean isCardiovascularRiskFactors() { return cardiovascularRiskFactors; }
    public void setCardiovascularRiskFactors(boolean cardiovascularRiskFactors) { this.cardiovascularRiskFactors = cardiovascularRiskFactors; }

    public boolean isAbdominalPain() { return abdominalPain; }
    public void setAbdominalPain(boolean abdominalPain) { this.abdominalPain = abdominalPain; }

    public boolean isNauseaVomiting() { return nauseaVomiting; }
    public void setNauseaVomiting(boolean nauseaVomiting) { this.nauseaVomiting = nauseaVomiting; }

    public boolean isDehydration() { return dehydration; }
    public void setDehydration(boolean dehydration) { this.dehydration = dehydration; }

    public boolean isRapidBreathing() { return rapidBreathing; }
    public void setRapidBreathing(boolean rapidBreathing) { this.rapidBreathing = rapidBreathing; }

    public boolean isDangerSigns() { return dangerSigns; }
    public void setDangerSigns(boolean dangerSigns) { this.dangerSigns = dangerSigns; }

    public Integer getTreatmentDuration() { return treatmentDuration; }
    public void setTreatmentDuration(Integer treatmentDuration) { this.treatmentDuration = treatmentDuration; }

    public boolean isHivPositive() { return hivPositive; }
    public void setHivPositive(boolean hivPositive) { this.hivPositive = hivPositive; }

    // Helper methods
    public void addCurrentMedication(String medication) {
        if (this.currentMedications == null) {
            this.currentMedications = new ArrayList<>();
        }
        this.currentMedications.add(medication);
    }

    public void addMedicationAllergy(String allergy) {
        if (this.medicationAllergies == null) {
            this.medicationAllergies = new ArrayList<>();
        }
        this.medicationAllergies.add(allergy);
    }

    public boolean hasMedicationAllergy(String medication) {
        if (medicationAllergies == null) return false;
        return medicationAllergies.stream()
                .anyMatch(allergy -> allergy.toLowerCase().contains(medication.toLowerCase()));
    }

    public boolean isTakingMedication(String medication) {
        if (currentMedications == null) return false;
        return currentMedications.stream()
                .anyMatch(med -> med.toLowerCase().contains(medication.toLowerCase()));
    }

    @Override
    public String toString() {
        return "MedicalHistory{" +
                "hypertension=" + hypertension +
                ", diabetes=" + diabetes +
                ", chronicKidneyDisease=" + chronicKidneyDisease +
                ", asthma=" + asthma +
                ", copd=" + copd +
                ", tonsilitis=" + tonsilitis +
                ", overweight=" + overweight +
                ", undernutrition=" + undernutrition +
                ", currentMedications=" + currentMedications +
                ", medicationAllergies=" + medicationAllergies +
                ", formerSmoker=" + formerSmoker +
                ", currentSmoker=" + currentSmoker +
                ", formerAlcohol=" + formerAlcohol +
                ", currentAlcohol=" + currentAlcohol +
                ", cad=" + cad +
                ", hyperkalemia=" + hyperkalemia +
                ", pregnant=" + pregnant +
                ", strokeHistory=" + strokeHistory +
                ", heartFailure=" + heartFailure +
                ", diabetesSymptoms=" + diabetesSymptoms +
                ", diabetesOnset='" + diabetesOnset + '\'' +
                ", ketoacidosisHistory=" + ketoacidosisHistory +
                ", autoimmuneDisease=" + autoimmuneDisease +
                ", obesity=" + obesity +
                ", familyHistoryDiabetes=" + familyHistoryDiabetes +
                ", historyGDM=" + historyGDM +
                ", renalImpairment=" + renalImpairment +
                ", liverDisease=" + liverDisease +
                ", cardiovascularDisease=" + cardiovascularDisease +
                ", neuropathySymptoms=" + neuropathySymptoms +
                ", persistentProteinuria=" + persistentProteinuria +
                ", cardiovascularRiskFactors=" + cardiovascularRiskFactors +
                ", abdominalPain=" + abdominalPain +
                ", nauseaVomiting=" + nauseaVomiting +
                ", dehydration=" + dehydration +
                ", rapidBreathing=" + rapidBreathing +
                ", dangerSigns=" + dangerSigns +
                ", treatmentDuration=" + treatmentDuration +
                ", hivPositive=" + hivPositive +
                '}';
    }
}