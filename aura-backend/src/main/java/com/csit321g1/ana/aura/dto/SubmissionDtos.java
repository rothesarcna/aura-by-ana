package com.csit321g1.ana.aura.dto;

import com.csit321g1.ana.aura.model.WorkStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class SubmissionDtos {
    private SubmissionDtos() {
    }

    public record SubmissionRequest(
            @NotBlank @Size(max = 500) String reference,
            @Size(max = 2000) String notes) {
    }

    public record SubmissionResponse(
            Long id,
            Long componentId,
            int version,
            String reference,
            String notes,
            WorkStatus status,
            String submittedBy,
            Instant submittedAt) {
    }
}