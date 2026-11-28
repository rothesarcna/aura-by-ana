package com.csit321g1.ana.aura.dto;

import java.time.Instant;

public final class NotificationDtos {
    private NotificationDtos() {
    }

    public record NotificationResponse(
            Long id,
            String type,
            String message,
            boolean read,
            Instant createdAt,
            Long projectId,
            String projectTitle) {
    }
}