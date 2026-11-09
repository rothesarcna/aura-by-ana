package com.csit321g1.ana.aura.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/** A generated snapshot or summary report of a project's status. */
@Getter
@Setter
@Entity
@Table(name = "project_reports")
public class ProjectReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private String reportType; // e.g., "WEEKLY_SUMMARY", "FINAL_PORTFOLIO"

    @Column(columnDefinition = "TEXT")
    private String reportData; 

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generated_by_id")
    private ProjectMember generatedBy;

    private Instant generatedAt;

    @PrePersist
    void onCreate() {
        generatedAt = Instant.now();
    }
}