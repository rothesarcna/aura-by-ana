package com.csit321g1.ana.aura.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

/** A deliverable inside a project: a research chapter, proposal, documentation, prototype, ... */
@Getter
@Setter
@Entity
@Table(name = "project_components")
public class ProjectComponent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private ComponentType type = ComponentType.OTHER;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private WorkStatus status = WorkStatus.PENDING;

    private LocalDate dueDate;

    private int progress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private ProjectMember owner_id;

    private boolean archived;

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
