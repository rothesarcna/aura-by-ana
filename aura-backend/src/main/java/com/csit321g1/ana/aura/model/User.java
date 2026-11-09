package com.csit321g1.ana.aura.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String role = "student";
    
    @Column(nullable = false)
    private String fullName;
    
    @Column(nullable = false, unique = true)
    private String studentId;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    private String course;
    
    @Column(nullable = false)
    private String password; // Note: In production, this must be hashed using BCrypt
}