package com.rwanda.health.cds.services;

import org.kie.api.KieServices;
import org.kie.api.builder.KieBuilder;
import org.kie.api.builder.KieFileSystem;
import org.kie.api.builder.Message;
import org.kie.api.runtime.KieContainer;
import org.kie.api.runtime.KieSession;
import org.kie.internal.io.ResourceFactory;
import com.rwanda.health.cds.models.PatientData;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public class DroolsRuleService {
    private KieContainer kieContainer;

    public DroolsRuleService() {
        System.out.println("🔄 Initializing DroolsRuleService (Guaranteed Approach)...");

        try {
            KieServices kieServices = KieServices.Factory.get();
            KieFileSystem kfs = kieServices.newKieFileSystem();

            // Load DRL content directly from classpath
            String drlContent = loadDrlFromClasspath();
            if (drlContent == null || drlContent.trim().isEmpty()) {
                throw new IllegalStateException("Failed to load DRL rules from classpath");
            }

            System.out.println("✅ Loaded DRL rules (" + drlContent.length() + " characters)");

            // Write DRL to KieFileSystem
            kfs.write("src/main/resources/rules.drl", drlContent);

            // Build the KieBase
            KieBuilder kieBuilder = kieServices.newKieBuilder(kfs);
            kieBuilder.buildAll();

            // Check for compilation errors
            if (kieBuilder.getResults().hasMessages(Message.Level.ERROR)) {
                System.err.println("❌ DRL Compilation Errors:");
                for (Message message : kieBuilder.getResults().getMessages()) {
                    System.err.println("  - " + message.getText());
                }
                throw new IllegalStateException("DRL compilation failed");
            }

            this.kieContainer = kieServices.newKieContainer(kieServices.getRepository().getDefaultReleaseId());
            System.out.println("✅ KieContainer created successfully");

        } catch (Exception e) {
            System.err.println("❌ Drools initialization failed: " + e.getMessage());
            e.printStackTrace();
            throw new IllegalStateException("Failed to initialize Drools engine", e);
        }
    }

    private String loadDrlFromClasspath() {
        try {
            // Try multiple classpath locations
            String[] possiblePaths = {
                    "com/rwanda/health/cds/rules/HypertensionRules.drl",
                    "/com/rwanda/health/cds/rules/HypertensionRules.drl",
                    "BOOT-INF/classes/com/rwanda/health/cds/rules/HypertensionRules.drl"
            };

            for (String path : possiblePaths) {
                try (InputStream is = getClass().getClassLoader().getResourceAsStream(path)) {
                    if (is != null) {
                        System.out.println("✅ Found DRL at: " + path);
                        return new String(is.readAllBytes(), StandardCharsets.UTF_8);
                    }
                }
            }

            // Last resort: try file system
            System.out.println("🔄 Trying file system...");
            try {
                java.nio.file.Path fsPath = java.nio.file.Paths.get("src/main/resources/com/rwanda/health/cds/rules/HypertensionRules.drl");
                if (java.nio.file.Files.exists(fsPath)) {
                    System.out.println("✅ Found DRL on file system");
                    return java.nio.file.Files.readString(fsPath);
                }
            } catch (Exception e) {
                System.err.println("File system check failed: " + e.getMessage());
            }

            System.err.println("❌ Could not find DRL file in any location");
            return null;

        } catch (Exception e) {
            System.err.println("❌ Error loading DRL: " + e.getMessage());
            return null;
        }
    }

    public PatientData evaluatePatient(PatientData patientData) {
        System.out.println("🔄 Evaluating patient with BP: " +
                patientData.getPhysicalExamination().getSystole() + "/" +
                patientData.getPhysicalExamination().getDiastole());

        KieSession kieSession = null;
        try {
            kieSession = kieContainer.newKieSession();
            System.out.println("✅ KieSession created");

            kieSession.insert(patientData);
            System.out.println("✅ PatientData inserted");

            int rulesFired = kieSession.fireAllRules();
            System.out.println("✅ Rules fired: " + rulesFired);

            if (rulesFired == 0) {
                System.err.println("⚠️ No rules fired! Check rule conditions");
            }

            return patientData;

        } catch (Exception e) {
            System.err.println("❌ Error in evaluatePatient: " + e.getMessage());
            e.printStackTrace();
            throw new IllegalStateException("Failed to evaluate patient: " + e.getMessage(), e);
        } finally {
            if (kieSession != null) {
                kieSession.dispose();
                System.out.println("✅ KieSession disposed");
            }
        }
    }
}