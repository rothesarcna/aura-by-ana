package com.csit321g1.ana.aura.service;

import com.csit321g1.ana.aura.dto.ComponentDtos.ComponentRequest;
import com.csit321g1.ana.aura.dto.ComponentDtos.ComponentResponse;
import com.csit321g1.ana.aura.dto.ComponentDtos.StatusChangeRequest;
import com.csit321g1.ana.aura.model.ComponentType;
import com.csit321g1.ana.aura.model.HistoryType;
import com.csit321g1.ana.aura.model.ProjectComponent;
import com.csit321g1.ana.aura.model.ProjectMember;
import com.csit321g1.ana.aura.model.WorkStatus;
import com.csit321g1.ana.aura.repository.ProjectComponentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ComponentService {

    private final ProjectComponentRepository components;
    private final AccessService access;
    private final SnapshotService snapshots;
    private final HistoryService history;

    public ComponentService(ProjectComponentRepository components,
                            AccessService access,
                            SnapshotService snapshots,
                            HistoryService history) {
        this.components = components;
        this.access = access;
        this.snapshots = snapshots;
        this.history = history;
    }

    // CREATE
    public ComponentResponse create(Long userId, Long projectId, ComponentRequest req) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);

        ProjectComponent c = new ProjectComponent();
        c.setProject_id(ctx.project());
        c.setName(Text.clean(req.name()));
        c.setDescription(Text.clean(req.description()));
        c.setType(req.type() == null ? ComponentType.OTHER : req.type());
        c.setDueDate(req.dueDate());
        c.setOwner_id(access.assignee(projectId, req.ownerId()));
        c.setStatus(req.status() == null ? WorkStatus.PENDING : req.status());
        c.setProgress(c.getStatus() == WorkStatus.APPROVED ? 100 : req.progress() == null ? 0 : req.progress());
        c = components.save(c);

        history.entry(ctx.project(), ctx.user(), HistoryType.COMPONENT,
                        "Added component \"" + c.getName() + "\" (due " + c.getDueDate() + ")")
                .component(c)
                .save();
        return snapshots.load(ctx.project()).toComponent(c);
    }

    /** Search and filter. All parameters are optional. Sorted by deadline, soonest first. */
    @Transactional(readOnly = true)
    public List<ComponentResponse> list(Long userId, Long projectId, String status, LocalDate dueFrom,
                                        LocalDate dueTo, Long ownerId, String q) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        WorkStatus wanted = Filters.parseEnum(WorkStatus.class, "status", status);
        Filters.checkRange(dueFrom, dueTo);

        ProjectSnapshot snap = snapshots.load(ctx.project());
        return snap.components().stream()
                .filter(c -> wanted == null || c.getStatus() == wanted)
                .filter(c -> Filters.inRange(c.getDueDate(), dueFrom, dueTo))
                .filter(c -> ownerId == null || (c.getOwner_id() != null && ownerId.equals(c.getOwner_id().getId())))
                .filter(c -> Filters.matches(q, c.getName(), c.getDescription()))
                .sorted(Comparator.comparing(ProjectComponent::getDueDate, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(ProjectComponent::getId))
                .map(snap::toComponent)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ComponentResponse get(Long userId, Long projectId, Long componentId) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        ProjectComponent c = access.component(projectId, componentId);
        return snapshots.load(ctx.project()).toComponent(c);
    }

    // UPDATE (details only; use changeStatus for the status)
    public ComponentResponse update(Long userId, Long projectId, Long componentId, ComponentRequest req) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        ProjectComponent c = access.component(projectId, componentId);
        ProjectMember newOwner = access.assignee(projectId, req.ownerId());
        ComponentType newType = req.type() == null ? c.getType() : req.type();
        int newProgress = c.getStatus() == WorkStatus.APPROVED ? 100 : req.progress() == null ? c.getProgress() : req.progress();

        List<String> changes = new ArrayList<>();
        Text.diff(changes, "name", c.getName(), Text.clean(req.name()));
        Text.diff(changes, "type", c.getType().getLabel(), newType.getLabel());
        Text.diff(changes, "due date", c.getDueDate(), req.dueDate());
        Text.diff(changes, "progress", c.getProgress() + "%", newProgress + "%");
        Text.diff(changes, "owner", c.getOwner_id() == null ? null : c.getOwner_id().getName(),
                newOwner == null ? null : newOwner.getName());
        Text.diffQuiet(changes, "description", c.getDescription(), Text.clean(req.description()));

        c.setName(Text.clean(req.name()));
        c.setDescription(Text.clean(req.description()));
        c.setType(newType);
        c.setDueDate(req.dueDate());
        c.setOwner_id(newOwner);
        c.setProgress(newProgress);
        components.save(c);

        if (!changes.isEmpty()) {
            history.entry(ctx.project(), ctx.user(), HistoryType.COMPONENT,
                            "Updated component \"" + c.getName() + "\" (" + String.join("; ", changes) + ")")
                    .component(c)
                    .save();
        }
        return snapshots.load(ctx.project()).toComponent(c);
    }

    /** Moves a component through Pending, Submitted, Under Review, For Revision, Resubmitted, Approved. */
    public ComponentResponse changeStatus(Long userId, Long projectId, Long componentId, StatusChangeRequest req) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        ProjectComponent c = access.component(projectId, componentId);
        WorkStatus before = c.getStatus();
        WorkStatus after = req.status();

        if (before != after) {
            c.setStatus(after);
            if (after == WorkStatus.APPROVED) {
                c.setProgress(100);
            }
            components.save(c);

            String note = Text.clean(req.note());
            history.entry(ctx.project(), ctx.user(), HistoryType.STATUS_CHANGE,
                            "\"" + c.getName() + "\" changed from " + before.getLabel() + " to " + after.getLabel()
                                    + (note == null ? "" : ". Note: " + note))
                    .component(c)
                    .values(before.getLabel(), after.getLabel())
                    .save();
        }
        return snapshots.load(ctx.project()).toComponent(c);
    }

    // DELETE: archives the component. Its feedback, tasks and history are kept but leave the working views.
    public void delete(Long userId, Long projectId, Long componentId) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        ProjectComponent c = access.component(projectId, componentId);
        c.setArchived(true);
        components.save(c);
        history.entry(ctx.project(), ctx.user(), HistoryType.COMPONENT,
                        "Removed (archived) component \"" + c.getName() + "\"")
                .component(c)
                .save();
    }
}
