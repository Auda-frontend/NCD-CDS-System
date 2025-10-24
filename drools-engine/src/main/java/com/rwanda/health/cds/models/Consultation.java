package com.rwanda.health.cds.models;

public class Consultation {
    private String practitionerName;
    private String consultationType;
    private String chiefComplaint;
    
    // Getters and Setters
    public String getPractitionerName() { return practitionerName; }
    public void setPractitionerName(String practitionerName) { this.practitionerName = practitionerName; }
    
    public String getConsultationType() { return consultationType; }
    public void setConsultationType(String consultationType) { this.consultationType = consultationType; }
    
    public String getChiefComplaint() { return chiefComplaint; }
    public void setChiefComplaint(String chiefComplaint) { this.chiefComplaint = chiefComplaint; }
}