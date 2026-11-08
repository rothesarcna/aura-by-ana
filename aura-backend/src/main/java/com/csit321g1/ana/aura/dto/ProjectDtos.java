package com.csit321g1.ana.aura.dto;

import com.csit321g1.ana.aura.model.WorkStatus;
import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class ProjectDtos {

    private ProjectDtos() {
    }

    /**
     * Create/update body. "adviser" also accepts "professor" (the name the frontend uses).
     * "members" is only read when creating: extra group members by name. Use the members
     * endpoints afterwards to add, edit or remove them.
     */
    public record ProjectRequest(
            @NotBlank @Size(max = 200) String title,
            @Size(max = 100) String type,
            @JsonAlias("professor") @Size(max = 150) String adviser,
            @Size(max = 50) String startDate,
            @Size(max = 5000) String description,
            @Size(max = 100) String semester,
            @Size(max = 100) String subjectSection,
            LocalDate deadline,
            WorkStatus status,
            List<@Size(max = 150) String> members) {
    }

    public record MemberRequest(
            @Size(max = 150) String name,
            @Size(max = 200) String email,
            @Size(max = 100) String role) {
    }

    public record MemberResponse(
            Long id,
            String name,
            String email,
            String role,
            Long userId,
            boolean registered,
            boolean active) {
    }

    public record ProjectResponse(
            Long id,
            String title,
            String type,
            String adviser,
            String professor,
            String startDate,
            String description,
            String semester,
            String subjectSection,
            LocalDate deadline,
            WorkStatus status,
            int progress,
            int componentCount,
            int openTaskCount,
            int unresolvedFeedbackCount,
            Long ownerId,
            List<MemberResponse> members,
            Instant createdAt,
            Instant updatedAt) {
    }
}
