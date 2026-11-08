package com.csit321g1.ana.aura.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
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

    private String semester;

    private String subjectSection;

    private LocalDate deadline;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private WorkStatus status = WorkStatus.PENDING;

    /** Projects are archived instead of deleted so their feedback and history are never lost. */
    private boolean archived;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    private Instant createdAt;

    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
