package com.csit321g1.ana.aura.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/** System alerts for a specific user. */
@Getter
@Setter
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String notification_type; // e.g., "TASK_ASSIGNED", "NEW_FEEDBACK"

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    private boolean isRead = false;

    private Instant createdAt;
    
    private Instant read_at;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}