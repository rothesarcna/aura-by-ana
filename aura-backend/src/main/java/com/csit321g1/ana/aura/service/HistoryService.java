package com.csit321g1.ana.aura.service;

import com.csit321g1.ana.aura.dto.HistoryDtos.HistoryResponse;
import com.csit321g1.ana.aura.dto.HistoryDtos.RevisionRequest;
import com.csit321g1.ana.aura.exception.BadRequestException;
import com.csit321g1.ana.aura.model.Feedback;
import com.csit321g1.ana.aura.model.HistoryEntry;
import com.csit321g1.ana.aura.model.HistoryType;
import com.csit321g1.ana.aura.model.Project;
import com.csit321g1.ana.aura.model.ProjectComponent;
import com.csit321g1.ana.aura.model.RevisionTask;
import com.csit321g1.ana.aura.model.User;
import com.csit321g1.ana.aura.repository.HistoryEntryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Writes and reads the project's append-only history. There is deliberately no method here (or
 * anywhere else) that edits or deletes an entry.
 */
@Service
@Transactional
public class HistoryService {

    /** Fluent helper so callers only set the links that apply to the entry. */
    public class EntryBuilder {
        private final HistoryEntry entry = new HistoryEntry();

        private EntryBuilder(Project project, User actor, HistoryType type, String message) {
            entry.setProject(project);
            entry.setActor(actor);
            entry.setActorName(actor == null ? null : actor.getFullName());
            entry.setType(type);
            entry.setMessage(message);
        }

        public EntryBuilder component(ProjectComponent c) {
            entry.setComponent(c);
            return this;
        }

        public EntryBuilder feedback(Feedback f) {
            entry.setFeedback(f);
            return this;
        }

        public EntryBuilder task(RevisionTask t) {
            entry.setTask(t);
            return this;
        }

        public EntryBuilder values(String oldValue, String newValue) {
            entry.setOldValue(oldValue);
            entry.setNewValue(newValue);
            return this;
        }

        public HistoryEntry save() {
            return repository.save(entry);
        }
    }

    private final HistoryEntryRepository repository;
    private final AccessService access;

    public HistoryService(HistoryEntryRepository repository, AccessService access) {
        this.repository = repository;
        this.access = access;
    }

    public EntryBuilder entry(Project project, User actor, HistoryType type, String message) {
        return new EntryBuilder(project, actor, type, message);
    }

    /** Newest first. All filters are optional. */
    @Transactional(readOnly = true)
    public List<HistoryResponse> list(Long userId, Long projectId, String type, Long componentId,
                                      Long feedbackId, Long taskId, LocalDate from, LocalDate to, String q) {
        access.require(projectId, userId);
        HistoryType wantedType = Filters.parseEnum(HistoryType.class, "type", type);
        Filters.checkRange(from, to);
        ZoneId zone = ZoneId.systemDefault();

        return repository.findByProjectIdOrderByCreatedAtDescIdDesc(projectId).stream()
                .filter(e -> wantedType == null || e.getType() == wantedType)
                .filter(e -> componentId == null
                        || (e.getComponent() != null && componentId.equals(e.getComponent().getId())))
                .filter(e -> feedbackId == null
                        || (e.getFeedback() != null && feedbackId.equals(e.getFeedback().getId())))
                .filter(e -> taskId == null || (e.getTask() != null && taskId.equals(e.getTask().getId())))
                .filter(e -> Filters.inRange(
                        e.getCreatedAt() == null ? null : e.getCreatedAt().atZone(zone).toLocalDate(), from, to))
                .filter(e -> Filters.matches(q, e.getMessage(), e.getActorName()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /** Documents a change the group made in response to feedback. */
    public HistoryResponse recordRevision(Long userId, Long projectId, RevisionRequest req) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        if (req.feedbackId() == null && req.taskId() == null && req.componentId() == null) {
            throw new BadRequestException("Give a feedbackId, taskId or componentId for the revision.");
        }

        Feedback feedback = req.feedbackId() == null ? null : access.feedback(projectId, req.feedbackId());
        RevisionTask task = req.taskId() == null ? null : access.task(projectId, req.taskId());
        ProjectComponent component = req.componentId() == null ? null : access.component(projectId, req.componentId());

        if (task != null && feedback == null) {
            feedback = task.getFeedback();
        }
        if (feedback != null && task != null && task.getFeedback() != null
                && !task.getFeedback().getId().equals(feedback.getId())) {
            throw new BadRequestException("That task belongs to a different feedback record.");
        }
        ProjectComponent derived = task != null ? task.getComponent() : feedback != null ? feedback.getComponent() : null;
        if (derived != null && component != null && !derived.getId().equals(component.getId())) {
            throw new BadRequestException("The component does not match the feedback or task.");
        }
        if (component == null) {
            component = derived;
        }

        String summary = req.summary().trim();
        String where = component == null ? "" : " on \"" + component.getName() + "\"";
        HistoryEntry saved = entry(ctx.project(), ctx.user(), HistoryType.REVISION, "Revision" + where + ": " + summary)
                .component(component)
                .feedback(feedback)
                .task(task)
                .save();
        return toResponse(saved);
    }

    private HistoryResponse toResponse(HistoryEntry e) {
        return new HistoryResponse(
                e.getId(),
                e.getType(),
                e.getMessage(),
                e.getComponent() == null ? null : e.getComponent().getId(),
                e.getComponent() == null ? null : e.getComponent().getName(),
                e.getFeedback() == null ? null : e.getFeedback().getId(),
                e.getTask() == null ? null : e.getTask().getId(),
                e.getOldValue(),
                e.getNewValue(),
                e.getActor() == null ? null : e.getActor().getId(),
                e.getActorName(),
                e.getCreatedAt());
    }
}
