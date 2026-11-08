package com.csit321g1.ana.aura.service;

import com.csit321g1.ana.aura.dto.OverviewDtos.DeadlineItem;
import com.csit321g1.ana.aura.dto.OverviewDtos.OverviewResponse;
import com.csit321g1.ana.aura.model.Feedback;
import com.csit321g1.ana.aura.model.FeedbackStatus;
import com.csit321g1.ana.aura.model.Project;
import com.csit321g1.ana.aura.model.ProjectComponent;
import com.csit321g1.ana.aura.model.RevisionTask;
import com.csit321g1.ana.aura.model.TaskStatus;
import com.csit321g1.ana.aura.model.WorkStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** The project overview: component statuses, outstanding tasks, unresolved feedback and upcoming deadlines. */
@Service
@Transactional(readOnly = true)
public class OverviewService {

    private static final int DEFAULT_DAYS = 14;
    private static final int MAX_DAYS = 365;

    private final AccessService access;
    private final SnapshotService snapshots;

    public OverviewService(AccessService access, SnapshotService snapshots) {
        this.access = access;
        this.snapshots = snapshots;
    }

    /** days = how far ahead "upcoming" looks (default 14). Overdue items are always included. */
    public OverviewResponse get(Long userId, Long projectId, Integer days) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        int horizon = days == null ? DEFAULT_DAYS : Math.max(0, Math.min(days, MAX_DAYS));
        ProjectSnapshot snap = snapshots.load(ctx.project());
        Project project = snap.project();
        LocalDate today = snap.today();
        LocalDate limit = today.plusDays(horizon);

        Map<String, Integer> counts = new LinkedHashMap<>();
        for (WorkStatus s : WorkStatus.values()) {
            counts.put(s.getLabel(), 0);
        }
        for (ProjectComponent c : snap.components()) {
            counts.merge(c.getStatus().getLabel(), 1, Integer::sum);
        }

        List<RevisionTask> outstanding = snap.tasks().stream()
                .filter(t -> t.getStatus() != TaskStatus.DONE)
                .sorted(Comparator.comparing(RevisionTask::getDueDate, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(RevisionTask::getId))
                .collect(Collectors.toList());

        List<Feedback> unresolved = snap.feedback().stream()
                .filter(f -> f.getStatus() == FeedbackStatus.OPEN)
                .sorted(Comparator.comparing(Feedback::getReceivedOn, Comparator.nullsLast(Comparator.<LocalDate>reverseOrder()))
                        .thenComparing(Feedback::getId, Comparator.reverseOrder()))
                .collect(Collectors.toList());

        List<DeadlineItem> deadlines = new ArrayList<>();
        for (ProjectComponent c : snap.components()) {
            if (c.getStatus() != WorkStatus.APPROVED && c.getDueDate() != null && !c.getDueDate().isAfter(limit)) {
                deadlines.add(new DeadlineItem("COMPONENT", c.getId(), c.getName(), c.getName(), c.getDueDate(),
                        ChronoUnit.DAYS.between(today, c.getDueDate()), snap.isComponentOverdue(c),
                        c.getStatus().getLabel(), c.getOwner() == null ? null : c.getOwner().getName()));
            }
        }
        for (RevisionTask t : outstanding) {
            if (t.getDueDate() != null && !t.getDueDate().isAfter(limit)) {
                deadlines.add(new DeadlineItem("TASK", t.getId(), t.getTitle(), t.getComponent().getName(), t.getDueDate(),
                        ChronoUnit.DAYS.between(today, t.getDueDate()), snap.isTaskOverdue(t),
                        t.getStatus().getLabel(), t.getAssignee() == null ? null : t.getAssignee().getName()));
            }
        }
        deadlines.sort(Comparator.comparing(DeadlineItem::dueDate).thenComparing(DeadlineItem::kind).thenComparing(DeadlineItem::id));

        int overdueComponents = (int) snap.components().stream().filter(snap::isComponentOverdue).count();
        int overdueTasks = (int) outstanding.stream().filter(snap::isTaskOverdue).count();

        return new OverviewResponse(
                project.getId(),
                project.getTitle(),
                project.getStatus() == null ? WorkStatus.PENDING : project.getStatus(),
                project.getDeadline(),
                snap.overallProgress(),
                snap.components().size(),
                counts,
                overdueComponents,
                overdueTasks,
                snap.components().stream()
                        .sorted(Comparator.comparing(ProjectComponent::getDueDate, Comparator.nullsLast(Comparator.naturalOrder()))
                                .thenComparing(ProjectComponent::getId))
                        .map(snap::toComponent)
                        .collect(Collectors.toList()),
                outstanding.stream().map(snap::toTask).collect(Collectors.toList()),
                unresolved.stream().map(snap::toFeedback).collect(Collectors.toList()),
                deadlines);
    }
}
