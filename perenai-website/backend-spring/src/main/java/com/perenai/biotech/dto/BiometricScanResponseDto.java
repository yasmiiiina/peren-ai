package com.perenai.biotech.dto;

import java.time.LocalDateTime;

public class BiometricScanResponseDto {

    private Long scanId;
    private LocalDateTime scanDate;

    // Raw Volumes (cm3)
    private double skeletonVolume;
    private double muscleVolume;
    private double visceralFatVolume;
    private double subcutaneousFatVolume;

    // Converted Masses (kg) based on biological density coefficients
    private double skeletonMassKg;
    private double muscleMassKg;
    private double visceralFatMassKg;
    private double subcutaneousFatMassKg;
    private double totalMassKg;

    // Asymmetry Analysis
    private double armMuscleAsymmetryPercent;
    private String armAsymmetryStatus; // Balanced, Left-Dominant, Right-Dominant
    private double legMuscleAsymmetryPercent;
    private String legAsymmetryStatus; // Balanced, Left-Dominant, Right-Dominant

    // Clinical Evaluation (Visceral Fat)
    private String visceralFatStatus; // OPTIMAL, NORMAL, WARNING, CRITICAL
    private String visceralFatInterpretation;

    // Constructor
    public BiometricScanResponseDto() {}

    // Getters and Setters
    public Long getScanId() { return scanId; }
    public void setScanId(Long scanId) { this.scanId = scanId; }

    public LocalDateTime getScanDate() { return scanDate; }
    public void setScanDate(LocalDateTime scanDate) { this.scanDate = scanDate; }

    public double getSkeletonVolume() { return skeletonVolume; }
    public void setSkeletonVolume(double skeletonVolume) { this.skeletonVolume = skeletonVolume; }

    public double getMuscleVolume() { return muscleVolume; }
    public void setMuscleVolume(double muscleVolume) { this.muscleVolume = muscleVolume; }

    public double getVisceralFatVolume() { return visceralFatVolume; }
    public void setVisceralFatVolume(double visceralFatVolume) { this.visceralFatVolume = visceralFatVolume; }

    public double getSubcutaneousFatVolume() { return subcutaneousFatVolume; }
    public void setSubcutaneousFatVolume(double subcutaneousFatVolume) { this.subcutaneousFatVolume = subcutaneousFatVolume; }

    public double getSkeletonMassKg() { return skeletonMassKg; }
    public void setSkeletonMassKg(double skeletonMassKg) { this.skeletonMassKg = skeletonMassKg; }

    public double getMuscleMassKg() { return muscleMassKg; }
    public void setMuscleMassKg(double muscleMassKg) { this.muscleMassKg = muscleMassKg; }

    public double getVisceralFatMassKg() { return visceralFatMassKg; }
    public void setVisceralFatMassKg(double visceralFatMassKg) { this.visceralFatMassKg = visceralFatMassKg; }

    public double getSubcutaneousFatMassKg() { return subcutaneousFatMassKg; }
    public void setSubcutaneousFatMassKg(double subcutaneousFatMassKg) { this.subcutaneousFatMassKg = subcutaneousFatMassKg; }

    public double getTotalMassKg() { return totalMassKg; }
    public void setTotalMassKg(double totalMassKg) { this.totalMassKg = totalMassKg; }

    public double getArmMuscleAsymmetryPercent() { return armMuscleAsymmetryPercent; }
    public void setArmMuscleAsymmetryPercent(double armMuscleAsymmetryPercent) { this.armMuscleAsymmetryPercent = armMuscleAsymmetryPercent; }

    public String getArmAsymmetryStatus() { return armAsymmetryStatus; }
    public void setArmAsymmetryStatus(String armAsymmetryStatus) { this.armAsymmetryStatus = armAsymmetryStatus; }

    public double getLegMuscleAsymmetryPercent() { return legMuscleAsymmetryPercent; }
    public void setLegMuscleAsymmetryPercent(double legMuscleAsymmetryPercent) { this.legMuscleAsymmetryPercent = legMuscleAsymmetryPercent; }

    public String getLegAsymmetryStatus() { return legAsymmetryStatus; }
    public void setLegAsymmetryStatus(String legAsymmetryStatus) { this.legAsymmetryStatus = legAsymmetryStatus; }

    public String getVisceralFatStatus() { return visceralFatStatus; }
    public void setVisceralFatStatus(String visceralFatStatus) { this.visceralFatStatus = visceralFatStatus; }

    public String getVisceralFatInterpretation() { return visceralFatInterpretation; }
    public void setVisceralFatInterpretation(String visceralFatInterpretation) { this.visceralFatInterpretation = visceralFatInterpretation; }
}
