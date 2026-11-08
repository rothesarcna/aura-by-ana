package com.csit321g1.ana.aura.dto;

import com.csit321g1.ana.aura.model.TaskStatus;
import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;

public final class TaskDtos {

    private TaskDtos() {
    }

    /**
     * Create/update body. Link a task to feedback with feedbackId (or create it under
     * POST .../feedback/{id}/tasks). A task without feedback must name its component.
     * feedbackId, componentId and status are only read on create; update ignores them.
     */
    public record TaskRequest(
            @NotBlank @Size(max = 200) String title,
            @Size(max = 5000) String description,
            Long feedbackId,
            Long componentId,
            Long assigneeId,
            @JsonAlias("due") LocalDate dueDate,
            TaskStatus status) {
    }

    public record TaskStatusRequest(@NotNull TaskStatus status) {
    }

    public record TaskResponse(
            Long id,
            Long projectId,
            Long componentId,
            String componentName,
            Long feedbackId,
            String feedbackSummary,
            String title,
            String description,
            TaskStatus status,
            Long assigneeId,
            String assigneeName,
            LocalDate dueDate,
            boolean overdue,
            Instant completedAt,
            Instant createdAt,
            Instant updatedAt) {
    }
}
