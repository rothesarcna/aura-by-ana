package com.csit321g1.ana.aura.dto;

import com.csit321g1.ana.aura.dto.ComponentDtos.ComponentResponse;
import com.csit321g1.ana.aura.dto.FeedbackDtos.FeedbackResponse;
import com.csit321g1.ana.aura.dto.TaskDtos.TaskResponse;
import com.csit321g1.ana.aura.model.WorkStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public final class OverviewDtos {

    private OverviewDtos() {
    }

    /** A component or task that is due soon (or already overdue). */
    public record DeadlineItem(
            String kind,
            Long id,
            String title,
            String componentName,
            LocalDate dueDate,
            long daysRemaining,
            boolean overdue,
            String status,
            String assigneeName) {
    }

    public record OverviewResponse(
            Long projectId,
            String title,
            WorkStatus status,
            LocalDate deadline,
            int overallProgress,
            int totalComponents,
            Map<String, Integer> componentStatusCounts,
            int overdueComponentCount,
            int overdueTaskCount,
            List<ComponentResponse> components,
            List<TaskResponse> outstandingTasks,
            List<FeedbackResponse> unresolvedFeedback,
            List<DeadlineItem> upcomingDeadlines) {
    }
}
