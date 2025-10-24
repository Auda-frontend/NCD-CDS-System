package com.rwanda.health.cds.models;

public class PatientDemographics {
    private String patientId;
    private String upid;
    private String fullName;
    private String gender;
    private int age;
    private String province;
    private String district;
    private String sector;
    private String cell;
    private String village;
    
    // Constructors
    public PatientDemographics() {}
    
    public PatientDemographics(String patientId, String upid, String fullName, String gender, int age) {
        this.patientId = patientId;
        this.upid = upid;
        this.fullName = fullName;
        this.gender = gender;
        this.age = age;
    }
    
    // Getters and Setters
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    
    public String getUpid() { return upid; }
    public void setUpid(String upid) { this.upid = upid; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
    
    public String getProvince() { return province; }
    public void setProvince(String province) { this.province = province; }
    
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    
    public String getSector() { return sector; }
    public void setSector(String sector) { this.sector = sector; }
    
    public String getCell() { return cell; }
    public void setCell(String cell) { this.cell = cell; }
    
    public String getVillage() { return village; }
    public void setVillage(String village) { this.village = village; }
}