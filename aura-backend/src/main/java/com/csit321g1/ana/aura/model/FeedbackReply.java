package com.csit321g1.ana.aura.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/** A note added to a feedback record, e.g. the instructor's answer to a clarification question. */
@Getter
@Setter
@Entity
@Table(name = "feedback_replies")
public class FeedbackReply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "feedback_id", nullable = false)
    private Feedback feedback_id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author_id;

    @Column(nullable = false)
    private String authorName;

    @Column(name = "reply_text", columnDefinition = "TEXT", nullable = false)
    private String text;

    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
