package com.csit321g1.ana.aura.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

/**
 * One piece of instructor feedback (or a student's clarification question) about a component.
 *
 * The text of a feedback record is never edited in place. When the instructor changes their
 * instructions, a new record is created whose previousFeedback points at the old one and the old
 * one becomes SUPERSEDED, so every earlier version stays on file.
 */
@Getter
@Setter
@Entity
@Table(name = "feedback_items")
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project_id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "component_id", nullable = false)
    private ProjectComponent component_id;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private FeedbackType type = FeedbackType.FEEDBACK;

    @Column(name = "feedback_text", columnDefinition = "TEXT", nullable = false)
    private String text;

    /** Who gave the feedback (usually the adviser). */
    private String givenBy;

    /** The date the feedback was received; the student can set it when recording older feedback. */
    private LocalDate receivedOn;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private FeedbackStatus status = FeedbackStatus.OPEN;

    private int versionNumber = 1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "previous_feedback_id")
    private Feedback previous_feedback_id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by_id")
    private User recorded_by_id;

    private Instant createdAt;

    private Instant resolvedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
