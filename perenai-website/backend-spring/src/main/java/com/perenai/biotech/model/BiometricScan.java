package com.perenai.biotech.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "biometric_scans")
public class BiometricScan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "scan_date", nullable = false)
    private LocalDateTime scanDate;

    // Total volumes in cm3
    @Column(name = "skeleton_volume", nullable = false)
    private double skeletonVolume;

    @Column(name = "muscle_volume", nullable = false)
    private double muscleVolume;

    @Column(name = "visceral_fat_volume", nullable = false)
    private double visceralFatVolume;

    @Column(name = "subcutaneous_fat_volume", nullable = false)
    private double subcutaneousFatVolume;

    // Segmented limb volumes in cm3 (for asymmetry comparison)
    @Column(name = "left_arm_muscle_volume", nullable = false)
    private double leftArmMuscleVolume;

    @Column(name = "right_arm_muscle_volume", nullable = false)
    private double rightArmMuscleVolume;

    @Column(name = "left_leg_muscle_volume", nullable = false)
    private double leftLegMuscleVolume;

    @Column(name = "right_leg_muscle_volume", nullable = false)
    private double rightLegMuscleVolume;

    // Default Constructor
    public BiometricScan() {}

    public BiometricScan(User user, LocalDateTime scanDate, double skeletonVolume, double muscleVolume, 
                         double visceralFatVolume, double subcutaneousFatVolume, double leftArmMuscleVolume, 
                         double rightArmMuscleVolume, double leftLegMuscleVolume, double rightLegMuscleVolume) {
        this.user = user;
        this.scanDate = scanDate;
        this.skeletonVolume = skeletonVolume;
        this.muscleVolume = muscleVolume;
        this.visceralFatVolume = visceralFatVolume;
        this.subcutaneousFatVolume = subcutaneousFatVolume;
        this.leftArmMuscleVolume = leftArmMuscleVolume;
        this.rightArmMuscleVolume = rightArmMuscleVolume;
        this.leftLegMuscleVolume = leftLegMuscleVolume;
        this.rightLegMuscleVolume = rightLegMuscleVolume;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

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

    public double getLeftArmMuscleVolume() { return leftArmMuscleVolume; }
    public void setLeftArmMuscleVolume(double leftArmMuscleVolume) { this.leftArmMuscleVolume = leftArmMuscleVolume; }

    public double getRightArmMuscleVolume() { return rightArmMuscleVolume; }
    public void setRightArmMuscleVolume(double rightArmMuscleVolume) { this.rightArmMuscleVolume = rightArmMuscleVolume; }

    public double getLeftLegMuscleVolume() { return leftLegMuscleVolume; }
    public void setLeftLegMuscleVolume(double leftLegMuscleVolume) { this.leftLegMuscleVolume = leftLegMuscleVolume; }

    public double getRightLegMuscleVolume() { return rightLegMuscleVolume; }
    public void setRightLegMuscleVolume(double rightLegMuscleVolume) { this.rightLegMuscleVolume = rightLegMuscleVolume; }
}
