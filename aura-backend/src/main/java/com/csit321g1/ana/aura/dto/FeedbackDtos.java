package com.csit321g1.ana.aura.dto;

import com.csit321g1.ana.aura.model.FeedbackStatus;
import com.csit321g1.ana.aura.model.FeedbackType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class FeedbackDtos {

    private FeedbackDtos() {
    }

    public record FeedbackRequest(
            @NotNull Long componentId,
            FeedbackType type,
            @NotBlank @Size(max = 5000) String text,
            @Size(max = 150) String givenBy,
            LocalDate receivedOn) {
    }

    /** The instructor changed their instructions: records a new version and keeps the old one. */
    public record ReviseRequest(
            @NotBlank @Size(max = 5000) String text,
            @Size(max = 150) String givenBy,
            LocalDate receivedOn,
            @Size(max = 1000) String reason) {
    }

    /** Only OPEN and RESOLVED can be set by hand; SUPERSEDED is set by revising. */
    public record FeedbackStatusRequest(@NotNull FeedbackStatus status) {
    }

    public record ReplyRequest(@NotBlank @Size(max = 5000) String text) {
    }

    public record FeedbackResponse(
            Long id,
            Long projectId,
            Long componentId,
            String componentName,
            FeedbackType type,
            String text,
            String givenBy,
            LocalDate receivedOn,
            FeedbackStatus status,
            int version,
            Long previousFeedbackId,
            Long supersededById,
            int openTaskCount,
            int totalTaskCount,
            String recordedBy,
            Instant createdAt,
            Instant resolvedAt,
            List<ReplyResponse> replies) {
    }

    public record ReplyResponse(Long id, String author, String text, Instant createdAt) {
    }

    /** One entry in a feedback record's version chain. */
    public record VersionSummary(
            Long id,
            int version,
            FeedbackStatus status,
            String text,
            String givenBy,
            LocalDate receivedOn,
            Instant createdAt) {
    }

    public record FeedbackDetailResponse(
            FeedbackResponse feedback,
            List<TaskDtos.TaskResponse> tasks,
            List<ReplyResponse> replies,
            List<VersionSummary> versions) {
    }
}
