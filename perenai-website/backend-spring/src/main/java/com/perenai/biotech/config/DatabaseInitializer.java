package com.perenai.biotech.config;

import com.perenai.biotech.model.BiometricScan;
import com.perenai.biotech.model.User;
import com.perenai.biotech.repository.BiometricScanRepository;
import com.perenai.biotech.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BiometricScanRepository scanRepository;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            // Seed User: 26-year-old active profile
            User user = new User("Mohamed Ghafir", "mohamed.ghafir@peren.ai", "Male", 26, "Fitness", true);
            userRepository.save(user);

            // Seed historical scans (timeline) to demonstrate progression
            LocalDateTime now = LocalDateTime.now();

            // Scan 1: 3 months ago (baseline)
            BiometricScan scan1 = new BiometricScan(
                user, now.minusMonths(3),
                17150, 16200, 2900, 4800,
                2100, 2150, 4200, 4250
            );
            scanRepository.save(scan1);

            // Scan 2: 2 months ago (midpoint check)
            BiometricScan scan2 = new BiometricScan(
                user, now.minusMonths(2),
                17190, 16400, 2750, 4650,
                2120, 2140, 4220, 4260
            );
            scanRepository.save(scan2);

            // Scan 3: 1 month ago (recent)
            BiometricScan scan3 = new BiometricScan(
                user, now.minusMonths(1),
                17220, 16620, 2620, 4400,
                2130, 2145, 4240, 4270
            );
            scanRepository.save(scan3);

            // Scan 4: Today (latest)
            BiometricScan scan4 = new BiometricScan(
                user, now,
                17240, 16780, 2580, 4310,
                2140, 2150, 4250, 4275
            );
            scanRepository.save(scan4);

            System.out.println(">>> Biotech database successfully initialized with scientific mock user and scans history.");
        }
    }
}
