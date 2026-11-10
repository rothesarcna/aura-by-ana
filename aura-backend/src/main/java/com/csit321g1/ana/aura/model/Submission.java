package com.csit321g1.ana.aura.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/** A student's uploaded work for a specific component. */
@Getter
@Setter
@Entity
@Table(name = "submissions")
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "component_id", nullable = false)
    private ProjectComponent component;

    private int version_number = 1;

    /** Google Drive link, GitHub repository, or filename. */
    @Column(nullable = false)
    private String submission_reference;

    @Column(columnDefinition = "TEXT")
    private String submission_notes;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private WorkStatus status = WorkStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by_id")
    private User submitted_by;

    private Instant submitted_at;

    @PrePersist
    void onCreate() {
        submitted_at = Instant.now();
    }
}