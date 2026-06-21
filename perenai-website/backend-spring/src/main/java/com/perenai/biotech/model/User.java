package com.perenai.biotech.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String gender; // Male, Female

    @Column(nullable = false)
    private int age;

    @Column(name = "activity_level", nullable = false)
    private String activityLevel; // Fitness, Cycling, Running, Strength

    @Column(name = "is_premium", nullable = false)
    private boolean isPremium;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BiometricScan> scans = new ArrayList<>();

    // Default Constructor
    public User() {}

    public User(String name, String email, String gender, int age, String activityLevel, boolean isPremium) {
        this.name = name;
        this.email = email;
        this.gender = gender;
        this.age = age;
        this.activityLevel = activityLevel;
        this.isPremium = isPremium;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }

    public String getActivityLevel() { return activityLevel; }
    public void setActivityLevel(String activityLevel) { this.activityLevel = activityLevel; }

    public boolean isPremium() { return isPremium; }
    public void setPremium(boolean premium) { isPremium = premium; }

    public List<BiometricScan> getScans() { return scans; }
    public void setScans(List<BiometricScan> scans) { this.scans = scans; }
}
