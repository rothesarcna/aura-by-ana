package com.csit321g1.ana.aura.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * Append-only audit trail of everything that happens in a project: feedback received, revisions
 * documented, status changes, task changes. Every column is updatable=false and the services expose
 * no update or delete, so earlier records are never altered or removed.
 */
@Getter
@Setter
@Entity
@Table(name = "history_entries")
public class HistoryEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false, updatable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "component_id", updatable = false)
    private ProjectComponent component_id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feedback_id", updatable = false)
    private Feedback feedback_id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", updatable = false)
    private RevisionTask task_id;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false, updatable = false)
    private HistoryType type;

    @Column(columnDefinition = "TEXT", nullable = false, updatable = false)
    private String message;

    /** For status changes: the value before and after (e.g. "Pending" -> "Submitted"). */
    @Column(updatable = false)
    private String oldValue;

    @Column(updatable = false)
    private String newValue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", updatable = false)
    private User actor_id;

    @Column(updatable = false)
    private String actorName;

    @Column(updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
