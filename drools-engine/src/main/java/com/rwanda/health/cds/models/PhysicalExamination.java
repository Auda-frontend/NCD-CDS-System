package com.rwanda.health.cds.models;

public class PhysicalExamination {
    private Double systole;
    private Double diastole;
    private String bpStatus;
    private Double height;
    private Double weight;
    private Double bmi;
    private String bmiStatus;
    private Double pulse;
    private Double temperature;
    private Double spO2;
    private Integer painScore;
    
    // Constructors
    public PhysicalExamination() {}
    
    public PhysicalExamination(Double systole, Double diastole) {
        this.systole = systole;
        this.diastole = diastole;
    }
    
    // Getters and Setters
    public Double getSystole() { return systole; }
    public void setSystole(Double systole) { this.systole = systole; }
    
    public Double getDiastole() { return diastole; }
    public void setDiastole(Double diastole) { this.diastole = diastole; }
    
    public String getBpStatus() { return bpStatus; }
    public void setBpStatus(String bpStatus) { this.bpStatus = bpStatus; }
    
    public Double getHeight() { return height; }
    public void setHeight(Double height) { this.height = height; }
    
    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }
    
    public Double getBmi() { return bmi; }
    public void setBmi(Double bmi) { this.bmi = bmi; }
    
    public String getBmiStatus() { return bmiStatus; }
    public void setBmiStatus(String bmiStatus) { this.bmiStatus = bmiStatus; }
    
    public Double getPulse() { return pulse; }
    public void setPulse(Double pulse) { this.pulse = pulse; }
    
    public Double getTemperature() { return temperature; }
    public void setTemperature(Double temperature) { this.temperature = temperature; }
    
    public Double getSpO2() { return spO2; }
    public void setSpO2(Double spO2) { this.spO2 = spO2; }
    
    public Integer getPainScore() { return painScore; }
    public void setPainScore(Integer painScore) { this.painScore = painScore; }
}