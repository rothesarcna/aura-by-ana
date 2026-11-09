package com.csit321g1.ana.aura.service;

import com.csit321g1.ana.aura.dto.TaskDtos.TaskRequest;
import com.csit321g1.ana.aura.dto.TaskDtos.TaskResponse;
import com.csit321g1.ana.aura.dto.TaskDtos.TaskStatusRequest;
import com.csit321g1.ana.aura.exception.BadRequestException;
import com.csit321g1.ana.aura.model.Feedback;
import com.csit321g1.ana.aura.model.FeedbackStatus;
import com.csit321g1.ana.aura.model.HistoryType;
import com.csit321g1.ana.aura.model.ProjectComponent;
import com.csit321g1.ana.aura.model.ProjectMember;
import com.csit321g1.ana.aura.model.RevisionTask;
import com.csit321g1.ana.aura.model.TaskStatus;
import com.csit321g1.ana.aura.repository.RevisionTaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/** Revision tasks: the actions that turn a feedback comment into work somebody owns. */
@Service
@Transactional
public class TaskService {

    private final RevisionTaskRepository tasks;
    private final AccessService access;
    private final SnapshotService snapshots;
    private final HistoryService history;

    public TaskService(RevisionTaskRepository tasks,
                       AccessService access,
                       SnapshotService snapshots,
                       HistoryService history) {
        this.tasks = tasks;
        this.access = access;
        this.snapshots = snapshots;
        this.history = history;
    }

    /**
     * Creates a task. When forcedFeedbackId is given (task created under a feedback record) it wins over
     * the feedbackId in the body. The task's component always comes from its feedback.
     */
    public TaskResponse create(Long userId, Long projectId, TaskRequest req, Long forcedFeedbackId) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);

        Long feedbackId = forcedFeedbackId != null ? forcedFeedbackId : req.feedbackId();
        Feedback feedback = feedbackId == null ? null : access.feedback(projectId, feedbackId);
        if (feedback != null && feedback.getStatus() == FeedbackStatus.SUPERSEDED) {
            throw new BadRequestException("That feedback was replaced by a newer version. Link the task to the latest version.");
        }

        ProjectComponent component;
        if (feedback != null) {
            component = feedback.getComponent_id();
            if (req.componentId() != null && !req.componentId().equals(component.getId())) {
                throw new BadRequestException("The component does not match the feedback's component.");
            }
        } else {
            if (req.componentId() == null) {
                throw new BadRequestException("Give a feedbackId, or a componentId for a general task.");
            }
            component = access.component(projectId, req.componentId());
        }

        ProjectMember assignee = access.assignee(projectId, req.assigneeId());
        TaskStatus status = req.status() == null ? TaskStatus.TO_DO : req.status();

        RevisionTask t = new RevisionTask();
        t.setProject_id(ctx.project());
        t.setComponent_id(component);
        t.setFeedback_id(feedback);
        t.setTitle(Text.clean(req.title()));
        t.setDescription(Text.clean(req.description()));
        t.setAssignee_id(assignee);
        t.setDueDate(req.dueDate());
        t.setStatus(status);
        t.setCompletedAt(status == TaskStatus.DONE ? Instant.now() : null);
        t.setCreated_by_id(ctx.user());
        t = tasks.save(t);

        history.entry(ctx.project(), ctx.user(), HistoryType.TASK,
                        "Created task \"" + t.getTitle() + "\" on \"" + component.getName() + "\""
                                + (assignee == null ? "" : ", assigned to " + assignee.getName())
                                + (t.getDueDate() == null ? "" : ", due " + t.getDueDate()))
                .component(component)
                .feedback(feedback)
                .task(t)
                .save();
        return snapshots.load(ctx.project()).toTask(t);
    }

    /**
     * Search and filter. All parameters are optional. mine=true limits the list to the caller's own
     * tasks; overdue=true keeps only unfinished tasks past their due date. Sorted by due date, soonest first.
     */
    @Transactional(readOnly = true)
    public List<TaskResponse> list(Long userId, Long projectId, String status, Long assigneeId, boolean mine,
                                   Long componentId, Long feedbackId, LocalDate dueFrom, LocalDate dueTo,
                                   boolean overdue, String q) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        TaskStatus wanted = Filters.parseEnum(TaskStatus.class, "status", status);
        Filters.checkRange(dueFrom, dueTo);
        Long wantedAssignee = mine ? ctx.member().getId() : assigneeId;

        ProjectSnapshot snap = snapshots.load(ctx.project());
        return snap.tasks().stream()
                .filter(t -> wanted == null || t.getStatus() == wanted)
                .filter(t -> wantedAssignee == null
                        || (t.getAssignee_id() != null && wantedAssignee.equals(t.getAssignee_id().getId())))
                .filter(t -> componentId == null || t.getComponent_id().getId().equals(componentId))
                .filter(t -> feedbackId == null
                        || (t.getFeedback_id() != null && feedbackId.equals(t.getFeedback_id().getId())))
                .filter(t -> Filters.inRange(t.getDueDate(), dueFrom, dueTo))
                .filter(t -> !overdue || snap.isTaskOverdue(t))
                .filter(t -> Filters.matches(q, t.getTitle(), t.getDescription()))
                .sorted(Comparator.comparing(RevisionTask::getDueDate, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(RevisionTask::getId))
                .map(snap::toTask)
                .collect(Collectors.toList());
    }

    /** The tasks linked to one feedback record. */
    @Transactional(readOnly = true)
    public List<TaskResponse> listForFeedback(Long userId, Long projectId, Long feedbackId) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        Feedback f = access.feedback(projectId, feedbackId);
        ProjectSnapshot snap = snapshots.load(ctx.project());
        return snap.tasksOf(f.getId()).stream().map(snap::toTask).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TaskResponse get(Long userId, Long projectId, Long taskId) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        RevisionTask t = access.task(projectId, taskId);
        return snapshots.load(ctx.project()).toTask(t);
    }

    // UPDATE: title, description, assignee, due date. The links to feedback and component never change.
    public TaskResponse update(Long userId, Long projectId, Long taskId, TaskRequest req) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        RevisionTask t = access.task(projectId, taskId);
        ProjectMember newAssignee = access.assignee(projectId, req.assigneeId());

        List<String> changes = new ArrayList<>();
        Text.diff(changes, "title", t.getTitle(), Text.clean(req.title()));
        Text.diff(changes, "assignee", t.getAssignee_id() == null ? null : t.getAssignee_id().getName(),
                newAssignee == null ? null : newAssignee.getName());
        Text.diff(changes, "due date", t.getDueDate(), req.dueDate());
        Text.diffQuiet(changes, "description", t.getDescription(), Text.clean(req.description()));

        t.setTitle(Text.clean(req.title()));
        t.setDescription(Text.clean(req.description()));
        t.setAssignee_id(newAssignee);
        t.setDueDate(req.dueDate());
        tasks.save(t);

        if (!changes.isEmpty()) {
            history.entry(ctx.project(), ctx.user(), HistoryType.TASK,
                            "Updated task \"" + t.getTitle() + "\" (" + String.join("; ", changes) + ")")
                    .component(t.getComponent_id())
                    .feedback(t.getFeedback_id())
                    .task(t)
                    .save();
        }
        return snapshots.load(ctx.project()).toTask(t);
    }

    public TaskResponse setStatus(Long userId, Long projectId, Long taskId, TaskStatusRequest req) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        RevisionTask t = access.task(projectId, taskId);
        TaskStatus before = t.getStatus();
        TaskStatus after = req.status();

        if (before != after) {
            t.setStatus(after);
            t.setCompletedAt(after == TaskStatus.DONE ? Instant.now() : null);
            tasks.save(t);
            history.entry(ctx.project(), ctx.user(), HistoryType.STATUS_CHANGE,
                            "Task \"" + t.getTitle() + "\" changed from " + before.getLabel() + " to " + after.getLabel())
                    .component(t.getComponent_id())
                    .feedback(t.getFeedback_id())
                    .task(t)
                    .values(before.getLabel(), after.getLabel())
                    .save();
        }
        return snapshots.load(ctx.project()).toTask(t);
    }

    // DELETE: archives the task. Its history entries stay.
    public void delete(Long userId, Long projectId, Long taskId) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        RevisionTask t = access.task(projectId, taskId);
        t.setArchived(true);
        tasks.save(t);
        history.entry(ctx.project(), ctx.user(), HistoryType.TASK, "Removed (archived) task \"" + t.getTitle() + "\"")
                .component(t.getComponent_id())
                .feedback(t.getFeedback_id())
                .task(t)
                .save();
    }
}
