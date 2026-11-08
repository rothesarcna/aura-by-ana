package com.csit321g1.ana.aura.dto;

import com.csit321g1.ana.aura.model.ComponentType;
import com.csit321g1.ana.aura.model.WorkStatus;
import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;

public final class ComponentDtos {

    private ComponentDtos() {
    }

    /** Every component needs a deadline. "status" is only used on create; change it later with PATCH .../status. */
    public record ComponentRequest(
            @NotBlank @Size(max = 200) String name,
            @Size(max = 5000) String description,
            ComponentType type,
            @NotNull @JsonAlias("due") LocalDate dueDate,
            @Min(0) @Max(100) Integer progress,
            Long ownerId,
            WorkStatus status) {
    }

    public record StatusChangeRequest(
            @NotNull WorkStatus status,
            @Size(max = 1000) String note) {
    }

    public record ComponentResponse(
            Long id,
            Long projectId,
            String name,
            String description,
            ComponentType type,
            WorkStatus status,
            LocalDate dueDate,
            int progress,
            Long ownerId,
            String ownerName,
            boolean overdue,
            int openFeedbackCount,
            int openTaskCount,
            Instant createdAt,
            Instant updatedAt) {
    }
}
