package com.rwanda.health.cds;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        System.out.println("🚀 Starting Clinical CDS Application...");
        SpringApplication.run(Application.class, args);
    }
}