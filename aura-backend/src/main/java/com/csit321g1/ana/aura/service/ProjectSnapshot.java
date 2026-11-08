package com.csit321g1.ana.aura.service;

import com.csit321g1.ana.aura.dto.ComponentDtos.ComponentResponse;
import com.csit321g1.ana.aura.dto.FeedbackDtos.FeedbackResponse;
import com.csit321g1.ana.aura.dto.FeedbackDtos.ReplyResponse;
import com.csit321g1.ana.aura.dto.ProjectDtos.MemberResponse;
import com.csit321g1.ana.aura.dto.ProjectDtos.ProjectResponse;
import com.csit321g1.ana.aura.dto.TaskDtos.TaskResponse;
import com.csit321g1.ana.aura.model.Feedback;
import com.csit321g1.ana.aura.model.FeedbackReply;
import com.csit321g1.ana.aura.model.FeedbackStatus;
import com.csit321g1.ana.aura.model.Project;
import com.csit321g1.ana.aura.model.ProjectComponent;
import com.csit321g1.ana.aura.model.ProjectMember;
import com.csit321g1.ana.aura.model.RevisionTask;
import com.csit321g1.ana.aura.model.TaskStatus;
import com.csit321g1.ana.aura.model.WorkStatus;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Everything about one project loaded once, plus the code that turns entities into response
 * objects. Project data is small (a student group's components, feedback and tasks), so loading
 * it whole keeps the services simple and avoids per-row queries.
 *
 * Must be used inside the transaction that loaded it (entities use lazy associations).
 *
 * "Visible" records are the ones in the working views: feedback and tasks of components that
 * have not been archived, and tasks that have not been archived. Archived and superseded records
 * are never deleted; they are simply not part of the working views.
 */
public class ProjectSnapshot {

    private final Project project;
    private final LocalDate today;
    private final List<ProjectMember> members;
    private final Map<Long, ProjectMember> memberById = new HashMap<>();
    private final Map<Long, ProjectComponent> componentById = new HashMap<>();
    private final List<ProjectComponent> components;
    private final List<Feedback> feedback;
    private final Map<Long, Feedback> supersededBy = new HashMap<>();
    private final List<RevisionTask> tasks;
    private final Map<Long, List<RevisionTask>> tasksByFeedback;
    private final Map<Long, List<ReplyResponse>> repliesByFeedback;

    ProjectSnapshot(Project project,
                    LocalDate today,
                    List<ProjectMember> allMembers,
                    List<ProjectComponent> allComponents,
                    List<Feedback> allFeedback,
                    List<FeedbackReply> allReplies,
                    List<RevisionTask> unarchivedTasks) {
        this.project = project;
        this.today = today;
        this.members = allMembers;
        allMembers.forEach(m -> memberById.put(m.getId(), m));
        allComponents.forEach(c -> componentById.put(c.getId(), c));
        this.components = allComponents.stream().filter(c -> !c.isArchived()).collect(Collectors.toList());
        this.feedback = allFeedback.stream().filter(f -> !f.getComponent().isArchived()).collect(Collectors.toList());
        for (Feedback f : allFeedback) {
            if (f.getPreviousFeedback() != null) {
                supersededBy.put(f.getPreviousFeedback().getId(), f);
            }
        }
        this.tasks = unarchivedTasks.stream().filter(t -> !t.getComponent().isArchived()).collect(Collectors.toList());
        this.tasksByFeedback = this.tasks.stream()
                .filter(t -> t.getFeedback() != null)
                .collect(Collectors.groupingBy(t -> t.getFeedback().getId()));
        this.repliesByFeedback = allReplies.stream()
                .collect(Collectors.groupingBy(r -> r.getFeedback().getId(),
                        Collectors.mapping(r -> new ReplyResponse(r.getId(), r.getAuthorName(), r.getText(), r.getCreatedAt()),
                                Collectors.toList())));
    }

    public Project project() {
        return project;
    }

    public LocalDate today() {
        return today;
    }

    public List<ProjectMember> activeMembers() {
        return members.stream().filter(ProjectMember::isActive).collect(Collectors.toList());
    }

    public List<ProjectComponent> components() {
        return components;
    }

    public List<Feedback> feedback() {
        return feedback;
    }

    public List<RevisionTask> tasks() {
        return tasks;
    }

    public List<RevisionTask> tasksOf(Long feedbackId) {
        return tasksByFeedback.getOrDefault(feedbackId, List.of());
    }

    // ---- derived values -------------------------------------------------

    public int overallProgress() {
        if (components.isEmpty()) {
            return 0;
        }
        return (int) Math.round(components.stream().mapToInt(ProjectComponent::getProgress).average().orElse(0));
    }

    public boolean isComponentOverdue(ProjectComponent c) {
        return c.getDueDate() != null && c.getDueDate().isBefore(today) && c.getStatus() != WorkStatus.APPROVED;
    }

    public boolean isTaskOverdue(RevisionTask t) {
        return t.getDueDate() != null && t.getDueDate().isBefore(today) && t.getStatus() != TaskStatus.DONE;
    }

    public String componentName(Long componentId) {
        ProjectComponent c = componentById.get(componentId);
        return c == null ? null : c.getName();
    }

    // ---- entity -> response ---------------------------------------------

    public MemberResponse toMember(ProjectMember m) {
        return new MemberResponse(
                m.getId(),
                m.getName(),
                m.getEmail(),
                m.getRole(),
                m.getUser() == null ? null : m.getUser().getId(),
                m.getUser() != null,
                m.isActive());
    }

    public ComponentResponse toComponent(ProjectComponent c) {
        int openFeedback = (int) feedback.stream()
                .filter(f -> f.getComponent().getId().equals(c.getId()) && f.getStatus() == FeedbackStatus.OPEN)
                .count();
        int openTasks = (int) tasks.stream()
                .filter(t -> t.getComponent().getId().equals(c.getId()) && t.getStatus() != TaskStatus.DONE)
                .count();
        return new ComponentResponse(
                c.getId(),
                project.getId(),
                c.getName(),
                c.getDescription(),
                c.getType(),
                c.getStatus(),
                c.getDueDate(),
                c.getProgress(),
                c.getOwner() == null ? null : c.getOwner().getId(),
                c.getOwner() == null ? null : c.getOwner().getName(),
                isComponentOverdue(c),
                openFeedback,
                openTasks,
                c.getCreatedAt(),
                c.getUpdatedAt());
    }

    public FeedbackResponse toFeedback(Feedback f) {
        List<RevisionTask> linked = tasksOf(f.getId());
        int open = (int) linked.stream().filter(t -> t.getStatus() != TaskStatus.DONE).count();
        Feedback newer = supersededBy.get(f.getId());
        return new FeedbackResponse(
                f.getId(),
                project.getId(),
                f.getComponent().getId(),
                f.getComponent().getName(),
                f.getType(),
                f.getText(),
                f.getGivenBy(),
                f.getReceivedOn(),
                f.getStatus(),
                f.getVersionNumber(),
                f.getPreviousFeedback() == null ? null : f.getPreviousFeedback().getId(),
                newer == null ? null : newer.getId(),
                open,
                linked.size(),
                f.getRecordedBy() == null ? null : f.getRecordedBy().getFullName(),
                f.getCreatedAt(),
                f.getResolvedAt(),
                repliesByFeedback.getOrDefault(f.getId(), List.of()));
    }

    public TaskResponse toTask(RevisionTask t) {
        return new TaskResponse(
                t.getId(),
                project.getId(),
                t.getComponent().getId(),
                t.getComponent().getName(),
                t.getFeedback() == null ? null : t.getFeedback().getId(),
                t.getFeedback() == null ? null : Text.snippet(t.getFeedback().getText(), 120),
                t.getTitle(),
                t.getDescription(),
                t.getStatus(),
                t.getAssignee() == null ? null : t.getAssignee().getId(),
                t.getAssignee() == null ? null : t.getAssignee().getName(),
                t.getDueDate(),
                isTaskOverdue(t),
                t.getCompletedAt(),
                t.getCreatedAt(),
                t.getUpdatedAt());
    }

    public ProjectResponse toProject() {
        int openTasks = (int) tasks.stream().filter(t -> t.getStatus() != TaskStatus.DONE).count();
        int unresolved = (int) feedback.stream().filter(f -> f.getStatus() == FeedbackStatus.OPEN).count();
        return new ProjectResponse(
                project.getId(),
                project.getTitle(),
                project.getType(),
                project.getAdviser(),
                project.getAdviser(),
                project.getStartDate(),
                project.getDescription(),
                project.getSemester(),
                project.getSubjectSection(),
                project.getDeadline(),
                project.getStatus() == null ? WorkStatus.PENDING : project.getStatus(),
                overallProgress(),
                components.size(),
                openTasks,
                unresolved,
                project.getOwner() == null ? null : project.getOwner().getId(),
                activeMembers().stream().map(this::toMember).collect(Collectors.toList()),
                project.getCreatedAt(),
                project.getUpdatedAt());
    }
}
