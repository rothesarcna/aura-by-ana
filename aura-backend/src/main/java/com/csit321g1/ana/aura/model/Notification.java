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
    private User user_id;

    @Column(nullable = false)
    private String notification_type; // e.g., "TASK_ASSIGNED", "NEW_FEEDBACK"

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    private boolean isRead = false;

    private Instant created_at;
    
    private Instant read_at;

    @PrePersist
    void onCreate() {
        created_at = Instant.now();
    }
}