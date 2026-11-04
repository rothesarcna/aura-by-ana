package com.csit321g1.ana.aura.model;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String type; // e.g., "Capstone Project"
    
    private String adviser;
    
    private String startDate;
    
    @Column(columnDefinition = "TEXT")
    private String description;
}