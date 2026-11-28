package com.csit321g1.ana.aura.service;

import com.csit321g1.ana.aura.model.FeedbackStatus;
import com.csit321g1.ana.aura.model.RevisionTask;
import com.csit321g1.ana.aura.model.TaskStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.OptionalDouble;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AnalyticsService {

    public record DelayedItem(Long id, String name, long daysLate, String status) {
    }

    public record MemberLoad(Long memberId, String name, int total, int done, int overdue) {
    }

    public record AnalyticsResponse(int progress, List<DelayedItem> delayedComponents, List<MemberLoad> memberLoad,
                                    Double avgDaysToCompleteTask, Map<String, Long> feedbackByComponent,
                                    int outstandingTasks, int unresolvedFeedback) {
    }

    private final AccessService access;
    private final SnapshotService snapshots;

    public AnalyticsService(AccessService access, SnapshotService snapshots) {
        this.access = access;
        this.snapshots = snapshots;
    }

    public AnalyticsResponse get(Long userId, Long projectId) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        ProjectSnapshot snap = snapshots.load(ctx.project());
        LocalDate today = snap.today();

        List<DelayedItem> delayed = snap.components().stream()
                .filter(snap::isComponentOverdue)
                .map(c -> new DelayedItem(c.getId(), c.getName(),
                        ChronoUnit.DAYS.between(c.getDueDate(), today), c.getStatus().getLabel()))
                .sorted(Comparator.comparingLong(DelayedItem::daysLate).reversed())
                .collect(Collectors.toList());

        List<MemberLoad> load = snap.activeMembers().stream().map(m -> {
            List<RevisionTask> mine = snap.tasks().stream()
                    .filter(t -> t.getAssignee_id() != null && t.getAssignee_id().getId().equals(m.getId()))
                    .collect(Collectors.toList());
            return new MemberLoad(m.getId(), m.getName(), mine.size(),
                    (int) mine.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count(),
                    (int) mine.stream().filter(snap::isTaskOverdue).count());
        }).collect(Collectors.toList());

        OptionalDouble hours = snap.tasks().stream()
                .filter(t -> t.getCompletedAt() != null && t.getCreatedAt() != null)
                .mapToLong(t -> Duration.between(t.getCreatedAt(), t.getCompletedAt()).toHours())
                .average();
        Double avgDays = hours.isPresent() ? Math.round(hours.getAsDouble() / 24 * 10) / 10.0 : null;

        Map<String, Long> byComponent = snap.feedback().stream()
                .collect(Collectors.groupingBy(f -> f.getComponent_id().getName(), Collectors.counting()));

        return new AnalyticsResponse(
                snap.overallProgress(), delayed, load, avgDays, byComponent,
                (int) snap.tasks().stream().filter(t -> t.getStatus() != TaskStatus.DONE).count(),
                (int) snap.feedback().stream().filter(f -> f.getStatus() == FeedbackStatus.OPEN).count());
    }
}