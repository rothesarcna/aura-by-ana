package com.csit321g1.ana.aura.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/** One AI-generated suggestion. Students can accept, edit or reject it. */
@Getter
@Setter
@Entity
@Table(name = "ai_suggestions")
public class AiSuggestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @Column(length = 20, nullable = false)
    private String mode;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String text;

    /** PENDING, ACCEPTED, EDITED or REJECTED */
    @Column(length = 20, nullable = false)
    private String status = "PENDING";

    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}