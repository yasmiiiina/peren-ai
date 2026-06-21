package com.perenai.biotech.service;

import com.perenai.biotech.dto.BiometricScanResponseDto;
import com.perenai.biotech.model.BiometricScan;
import com.perenai.biotech.model.User;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class PhysiologicalConversionService {

    // Clinical Biological Densities (g/cm3)
    public static final double DENSITY_SKELETON = 1.92;
    public static final double DENSITY_MUSCLE = 1.06;
    public static final double DENSITY_FAT = 0.90;

    /**
     * Converts volumes to estimated masses and evaluates indices.
     */
    public BiometricScanResponseDto processScan(BiometricScan scan) {
        User user = scan.getUser();
        BiometricScanResponseDto dto = new BiometricScanResponseDto();

        dto.setScanId(scan.getId());
        dto.setScanDate(scan.getScanDate());

        // Set volumes
        dto.setSkeletonVolume(scan.getSkeletonVolume());
        dto.setMuscleVolume(scan.getMuscleVolume());
        dto.setVisceralFatVolume(scan.getVisceralFatVolume());
        dto.setSubcutaneousFatVolume(scan.getSubcutaneousFatVolume());

        // Converted Masses (kg) = (Volume in cm3 * Density) / 1000
        double skeletonMass = round((scan.getSkeletonVolume() * DENSITY_SKELETON) / 1000.0, 2);
        double muscleMass = round((scan.getMuscleVolume() * DENSITY_MUSCLE) / 1000.0, 2);
        double visceralFatMass = round((scan.getVisceralFatVolume() * DENSITY_FAT) / 1000.0, 2);
        double subcutaneousFatMass = round((scan.getSubcutaneousFatVolume() * DENSITY_FAT) / 1000.0, 2);
        
        dto.setSkeletonMassKg(skeletonMass);
        dto.setMuscleMassKg(muscleMass);
        dto.setVisceralFatMassKg(visceralFatMass);
        dto.setSubcutaneousFatMassKg(subcutaneousFatMass);
        dto.setTotalMassKg(round(skeletonMass + muscleMass + visceralFatMass + subcutaneousFatMass, 2));

        // Muscular Asymmetry Calculation (Left vs Right limbs)
        // Arms
        double armAsym = calculateAsymmetry(scan.getLeftArmMuscleVolume(), scan.getRightArmMuscleVolume());
        dto.setArmMuscleAsymmetryPercent(armAsym);
        dto.setArmAsymmetryStatus(determineAsymmetryStatus(scan.getLeftArmMuscleVolume(), scan.getRightArmMuscleVolume(), armAsym));

        // Legs
        double legAsym = calculateAsymmetry(scan.getLeftLegMuscleVolume(), scan.getRightLegMuscleVolume());
        dto.setLegMuscleAsymmetryPercent(legAsym);
        dto.setLegAsymmetryStatus(determineAsymmetryStatus(scan.getLeftLegMuscleVolume(), scan.getRightLegMuscleVolume(), legAsym));

        // Visceral Fat clinical rating based on 26 years, Fitness/active demographics
        evaluateVisceralFat(dto, scan.getVisceralFatVolume(), user.getAge(), user.getGender());

        return dto;
    }

    private double calculateAsymmetry(double left, double right) {
        if (left + right == 0) return 0.0;
        // Asymmetry standard formula: |L - R| / Mean * 100
        double result = (Math.abs(left - right) / ((left + right) / 2.0)) * 100.0;
        return round(result, 2);
    }

    private String determineAsymmetryStatus(double left, double right, double asymmetryPercent) {
        if (asymmetryPercent < 5.0) {
            return "Balanced";
        }
        return left > right ? "Left-Dominant" : "Right-Dominant";
    }

    /**
     * Evaluates visceral fat volume based on age and gender standard medical databases.
     */
    private void evaluateVisceralFat(BiometricScanResponseDto dto, double volume, int age, String gender) {
        // Clinical reference limits adjusted for young adults (around 26 years old)
        // Visceral fat volume in young healthy adults should ideally be low
        double optimalLimit = 1200.0;
        double normalLimit = 2200.0;
        double warningLimit = 3200.0;

        // Apply age adjustment coefficient (+1.5% limit increase per year over 30)
        if (age > 30) {
            double multiplier = 1.0 + (age - 30) * 0.015;
            optimalLimit *= multiplier;
            normalLimit *= multiplier;
            warningLimit *= multiplier;
        }

        // Apply minor female adjustment coefficient (-10% threshold volume due to lower visceral density)
        if ("female".equalsIgnoreCase(gender)) {
            optimalLimit *= 0.90;
            normalLimit *= 0.90;
            warningLimit *= 0.90;
        }

        if (volume < optimalLimit) {
            dto.setVisceralFatStatus("OPTIMAL");
            dto.setVisceralFatInterpretation("Votre niveau de graisse viscérale est excellent et offre un environnement cardio-métabolique hautement protecteur.");
        } else if (volume < normalLimit) {
            dto.setVisceralFatStatus("NORMAL");
            dto.setVisceralFatInterpretation("Votre volume de graisse viscérale se situe dans la plage clinique saine pour votre profil.");
        } else if (volume < warningLimit) {
            dto.setVisceralFatStatus("WARNING");
            dto.setVisceralFatInterpretation("Niveau légèrement élevé. Considérez une optimisation de votre protocole nutritionnel diurne.");
        } else {
            dto.setVisceralFatStatus("CRITICAL");
            dto.setVisceralFatInterpretation("Attention : niveau critique augmenté. Un accompagnement médical et un ajustement d'activité sont fortement conseillés.");
        }
    }

    private double round(double value, int places) {
        if (places < 0) throw new IllegalArgumentException();
        BigDecimal bd = BigDecimal.valueOf(value);
        bd = bd.setScale(places, RoundingMode.HALF_UP);
        return bd.doubleValue();
    }
}
