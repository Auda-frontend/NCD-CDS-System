package com.rwanda.health.cds.models;

import java.util.List;
import java.util.ArrayList;

public class Investigations {
    private Double hba1c;
    private Double fastingGlucose;
    private Double randomGlucose;
    private Double bloodGlucose;
    private Double egfr;
    private Boolean ketonuria;
    private Double urineProtein;
    private Double serumCreatinine;
    private Double ldlCholesterol;
    private List<String> additionalTests;

    // Constructors
    public Investigations() {
        this.additionalTests = new ArrayList<>();
    }

    public Investigations(Double hba1c, Double fastingGlucose, Double randomGlucose) {
        this();
        this.hba1c = hba1c;
        this.fastingGlucose = fastingGlucose;
        this.randomGlucose = randomGlucose;
    }

    // Getters and Setters
    public Double getHba1c() {
        return hba1c;
    }

    public void setHba1c(Double hba1c) {
        this.hba1c = hba1c;
    }

    public Double getFastingGlucose() {
        return fastingGlucose;
    }

    public void setFastingGlucose(Double fastingGlucose) {
        this.fastingGlucose = fastingGlucose;
    }

    public Double getRandomGlucose() {
        return randomGlucose;
    }

    public void setRandomGlucose(Double randomGlucose) {
        this.randomGlucose = randomGlucose;
    }

    public Double getBloodGlucose() {
        return bloodGlucose;
    }

    public void setBloodGlucose(Double bloodGlucose) {
        this.bloodGlucose = bloodGlucose;
    }

    public Double getEgfr() {
        return egfr;
    }

    public void setEgfr(Double egfr) {
        this.egfr = egfr;
    }

    public Boolean getKetonuria() {
        return ketonuria;
    }

    public void setKetonuria(Boolean ketonuria) {
        this.ketonuria = ketonuria;
    }

    public Double getUrineProtein() {
        return urineProtein;
    }

    public void setUrineProtein(Double urineProtein) {
        this.urineProtein = urineProtein;
    }

    public Double getSerumCreatinine() {
        return serumCreatinine;
    }

    public void setSerumCreatinine(Double serumCreatinine) {
        this.serumCreatinine = serumCreatinine;
    }

    public Double getLdlCholesterol() {
        return ldlCholesterol;
    }

    public void setLdlCholesterol(Double ldlCholesterol) {
        this.ldlCholesterol = ldlCholesterol;
    }

    public List<String> getAdditionalTests() {
        return additionalTests;
    }

    public void setAdditionalTests(List<String> additionalTests) {
        this.additionalTests = additionalTests;
    }

    public void addTest(String test) {
        if (this.additionalTests == null) {
            this.additionalTests = new ArrayList<>();
        }
        this.additionalTests.add(test);
    }

    @Override
    public String toString() {
        return "Investigations{" +
                "hba1c=" + hba1c +
                ", fastingGlucose=" + fastingGlucose +
                ", randomGlucose=" + randomGlucose +
                ", bloodGlucose=" + bloodGlucose +
                ", egfr=" + egfr +
                ", ketonuria=" + ketonuria +
                ", urineProtein=" + urineProtein +
                ", serumCreatinine=" + serumCreatinine +
                ", ldlCholesterol=" + ldlCholesterol +
                ", additionalTests=" + additionalTests +
                '}';
    }
}