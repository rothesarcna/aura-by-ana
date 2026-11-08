package com.csit321g1.ana.aura.dto;

import com.csit321g1.ana.aura.model.HistoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class HistoryDtos {

    private HistoryDtos() {
    }

    /**
     * Documents a change the group made in response to feedback. Give at least one of
     * feedbackId, taskId or componentId; the others are filled in from it when possible.
     */
    public record RevisionRequest(
            Long feedbackId,
            Long taskId,
            Long componentId,
            @NotBlank @Size(max = 5000) String summary) {
    }

    public record HistoryResponse(
            Long id,
            HistoryType type,
            String message,
            Long componentId,
            String componentName,
            Long feedbackId,
            Long taskId,
            String oldValue,
            String newValue,
            Long actorId,
            String actorName,
            Instant createdAt) {
    }
}
