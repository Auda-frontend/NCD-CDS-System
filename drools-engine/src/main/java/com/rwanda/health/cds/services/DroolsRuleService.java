package com.rwanda.health.cds.services;

import org.kie.api.KieServices;
import org.kie.api.builder.KieBuilder;
import org.kie.api.builder.KieFileSystem;
import org.kie.api.builder.Message;
import org.kie.api.runtime.KieContainer;
import org.kie.api.runtime.KieSession;
import com.rwanda.health.cds.models.PatientData;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public class DroolsRuleService {
    private KieContainer kieContainer;

    public DroolsRuleService() {
        System.out.println("Initializing DroolsRuleService...");

        try {
            KieServices kieServices = KieServices.Factory.get();
            KieFileSystem kfs = kieServices.newKieFileSystem();

            // Load both hypertension and diabetes DRL content
            List<String> drlFiles = new ArrayList<>();
            drlFiles.add("HypertensionRules.drl");
            drlFiles.add("DiabetesRules.drl");

            boolean rulesLoaded = false;

            for (String drlFile : drlFiles) {
                String drlContent = loadDrlFromClasspath(drlFile);
                if (drlContent != null && !drlContent.trim().isEmpty()) {
                    kfs.write("src/main/resources/" + drlFile, drlContent);
                    System.out.println("Loaded " + drlFile + " (" + drlContent.length() + " characters)");
                    rulesLoaded = true;
                } else {
                    System.err.println("Failed to load: " + drlFile);
                }
            }

            if (!rulesLoaded) {
                throw new IllegalStateException("Failed to load any DRL rules from classpath");
            }

            // Build the KieBase
            KieBuilder kieBuilder = kieServices.newKieBuilder(kfs);
            kieBuilder.buildAll();

            // Check for compilation errors
            if (kieBuilder.getResults().hasMessages(Message.Level.ERROR)) {
                System.err.println("DRL Compilation Errors:");
                for (Message message : kieBuilder.getResults().getMessages()) {
                    System.err.println("  - " + message.getText());
                }
                throw new IllegalStateException("DRL compilation failed");
            }

            this.kieContainer = kieServices.newKieContainer(kieServices.getRepository().getDefaultReleaseId());
            System.out.println("KieContainer created successfully with both hypertension and diabetes rules");

        } catch (Exception e) {
            System.err.println("Drools initialization failed: " + e.getMessage());
            e.printStackTrace();
            throw new IllegalStateException("Failed to initialize Drools engine", e);
        }
    }

    private String loadDrlFromClasspath(String drlFileName) {
        try {
            // Try multiple classpath locations
            String[] possiblePaths = {
                    "com/rwanda/health/cds/rules/" + drlFileName,
                    "/com/rwanda/health/cds/rules/" + drlFileName,
                    "BOOT-INF/classes/com/rwanda/health/cds/rules/" + drlFileName,
                    "rules/" + drlFileName,
                    "/rules/" + drlFileName
            };

            for (String path : possiblePaths) {
                try (InputStream is = getClass().getClassLoader().getResourceAsStream(path)) {
                    if (is != null) {
                        System.out.println("Found " + drlFileName + " at: " + path);
                        String content = new String(is.readAllBytes(), StandardCharsets.UTF_8);

                        // Validate that we actually got DRL content
                        if (content.contains("package") && content.contains("rule")) {
                            return content;
                        } else {
                            System.err.println("Invalid DRL content in " + path);
                        }
                    }
                }
            }

            // Last resort: try file system
            System.out.println("Trying file system for: " + drlFileName);
            try {
                java.nio.file.Path fsPath = java.nio.file.Paths.get("src/main/resources/com/rwanda/health/cds/rules/" + drlFileName);
                if (java.nio.file.Files.exists(fsPath)) {
                    System.out.println("Found " + drlFileName + " on file system");
                    String content = java.nio.file.Files.readString(fsPath);
                    if (content.contains("package") && content.contains("rule")) {
                        return content;
                    }
                }
            } catch (Exception e) {
                System.err.println("File system check failed for " + drlFileName + ": " + e.getMessage());
            }

            System.err.println("Could not find " + drlFileName + " in any location");
            return null;

        } catch (Exception e) {
            System.err.println("Error loading " + drlFileName + ": " + e.getMessage());
            return null;
        }
    }

    public PatientData evaluatePatient(PatientData patientData) {
        System.out.println("Evaluating patient data:");
        System.out.println("  BP: " + patientData.getPhysicalExamination().getSystole() +
                "/" + patientData.getPhysicalExamination().getDiastole());

        if (patientData.getMedicalHistory() != null) {
            System.out.println("  Diabetes: " + patientData.getMedicalHistory().isDiabetes());
            System.out.println("  Hypertension: " + patientData.getMedicalHistory().isHypertension());
        }

        if (patientData.getInvestigations() != null) {
            System.out.println("  HbA1c: " + patientData.getInvestigations().getHba1c());
            System.out.println("  Fasting Glucose: " + patientData.getInvestigations().getFastingGlucose());
        }

        KieSession kieSession = null;
        try {
            kieSession = kieContainer.newKieSession();
            System.out.println("KieSession created for both hypertension and diabetes rules");

            // Insert patient data
            kieSession.insert(patientData);
            System.out.println("PatientData inserted into session");

            // Fire all rules
            int rulesFired = kieSession.fireAllRules();
            System.out.println("Total rules fired: " + rulesFired);

            // Log detailed information about decisions
            if (patientData.getDecisions() != null) {
                System.out.println("Clinical decisions made: " + patientData.getDecisions().size());
                for (int i = 0; i < patientData.getDecisions().size(); i++) {
                    var decision = patientData.getDecisions().get(i);
                    System.out.println("  Decision " + (i + 1) + ": " +
                            decision.getDiagnosis() + " (" + decision.getStage() + ")");
                    if (decision.getSubClassification() != null) {
                        System.out.println("    Type: " + decision.getSubClassification());
                    }
                }
            }

            if (rulesFired == 0) {
                System.err.println("WARNING: No rules fired! Check rule conditions and patient data");
                System.err.println("Patient data summary:");
                System.err.println("  Has diabetes: " + (patientData.getMedicalHistory() != null && patientData.getMedicalHistory().isDiabetes()));
                System.err.println("  Has hypertension: " + (patientData.getMedicalHistory() != null && patientData.getMedicalHistory().isHypertension()));
                System.err.println("  Has investigations: " + (patientData.getInvestigations() != null));
                if (patientData.getInvestigations() != null) {
                    System.err.println("  HbA1c: " + patientData.getInvestigations().getHba1c());
                    System.err.println("  Fasting glucose: " + patientData.getInvestigations().getFastingGlucose());
                }
            }

            return patientData;

        } catch (Exception e) {
            System.err.println("Error in evaluatePatient: " + e.getMessage());
            e.printStackTrace();
            throw new IllegalStateException("Failed to evaluate patient: " + e.getMessage(), e);
        } finally {
            if (kieSession != null) {
                kieSession.dispose();
                System.out.println("KieSession disposed");
            }
        }
    }

    // Method to test individual rule sets
    public void testRuleLoading() {
        System.out.println("Testing rule loading...");

        String hypertensionRules = loadDrlFromClasspath("HypertensionRules.drl");
        String diabetesRules = loadDrlFromClasspath("DiabetesRules.drl");

        System.out.println("Hypertension rules loaded: " + (hypertensionRules != null));
        System.out.println("Diabetes rules loaded: " + (diabetesRules != null));

        if (hypertensionRules != null) {
            System.out.println("Hypertension rules contain 'package': " + hypertensionRules.contains("package"));
            System.out.println("Hypertension rules contain 'rule': " + hypertensionRules.contains("rule"));
        }

        if (diabetesRules != null) {
            System.out.println("Diabetes rules contain 'package': " + diabetesRules.contains("package"));
            System.out.println("Diabetes rules contain 'rule': " + diabetesRules.contains("rule"));
        }
    }
}