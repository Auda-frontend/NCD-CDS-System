package com.rwanda.health.cds;

import org.kie.api.KieServices;
import org.kie.api.runtime.KieContainer;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DebugDrools implements CommandLineRunner {

    @Override
    public void run(String... args) throws Exception {
        System.out.println("🔍 DEBUG: Starting Drools Debug...");

        try {
            KieServices kieServices = KieServices.Factory.get();
            System.out.println("✅ KieServices created");

            KieContainer kieContainer = kieServices.getKieClasspathContainer();
            System.out.println("✅ KieContainer created");

            // List all available KieBases
            System.out.println("📋 Available KieBases:");
            for (String kbaseName : kieContainer.getKieBaseNames()) {
                System.out.println("  - " + kbaseName);
            }

            // Try to create the session
            System.out.println("🔄 Trying to create KieSession 'cds-rules-session'...");
            try {
                var session = kieContainer.newKieSession("cds-rules-session");
                System.out.println("✅ SUCCESS: KieSession created!");
                session.dispose();
            } catch (Exception e) {
                System.out.println("❌ FAILED: " + e.getMessage());
                e.printStackTrace();
            }

        } catch (Exception e) {
            System.err.println("💥 CRITICAL ERROR: " + e.getMessage());
            e.printStackTrace();
        }
    }
}