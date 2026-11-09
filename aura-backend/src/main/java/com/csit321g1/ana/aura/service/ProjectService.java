package com.csit321g1.ana.aura.service;

import com.csit321g1.ana.aura.dto.ProjectDtos.ProjectRequest;
import com.csit321g1.ana.aura.dto.ProjectDtos.ProjectResponse;
import com.csit321g1.ana.aura.exception.ForbiddenException;
import com.csit321g1.ana.aura.model.HistoryType;
import com.csit321g1.ana.aura.model.Project;
import com.csit321g1.ana.aura.model.ProjectMember;
import com.csit321g1.ana.aura.model.User;
import com.csit321g1.ana.aura.model.WorkStatus;
import com.csit321g1.ana.aura.repository.ProjectMemberRepository;
import com.csit321g1.ana.aura.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProjectService {

    private final ProjectRepository projects;
    private final ProjectMemberRepository members;
    private final AccessService access;
    private final SnapshotService snapshots;
    private final HistoryService history;

    public ProjectService(ProjectRepository projects,
                          ProjectMemberRepository members,
                          AccessService access,
                          SnapshotService snapshots,
                          HistoryService history) {
        this.projects = projects;
        this.members = members;
        this.access = access;
        this.snapshots = snapshots;
        this.history = history;
    }

    // CREATE: the creator becomes the project owner and its first member
    public ProjectResponse create(Long userId, ProjectRequest req) {
        User user = access.requireUser(userId);

        Project project = new Project();
        apply(project, req);
        project.setStatus(req.status() == null ? WorkStatus.PENDING : req.status());
        project.setOwner(user);
        project = projects.save(project);

        addMember(project, user, user.getFullName(), user.getEmail(), "Team Leader");

        if (req.members() != null) {
            Set<String> seen = new HashSet<>();
            seen.add(user.getFullName().trim().toLowerCase(Locale.ROOT));
            for (String raw : req.members()) {
                String name = Text.clean(raw);
                if (name != null && seen.add(name.toLowerCase(Locale.ROOT))) {
                    addMember(project, null, name, null, "Member");
                }
            }
        }

        history.entry(project, user, HistoryType.PROJECT, "Created project \"" + project.getTitle() + "\"").save();
        return snapshots.load(project).toProject();
    }

    // READ (all projects the caller belongs to)
    @Transactional(readOnly = true)
    public List<ProjectResponse> list(Long userId) {
        User user = access.requireUser(userId);
        return members.findByUserIdAndActiveTrueAndProjectArchivedFalse(user.getId()).stream()
                .map(ProjectMember::getProject_id)
                .sorted(Comparator.comparing(Project::getId).reversed())
                .map(p -> snapshots.load(p).toProject())
                .collect(Collectors.toList());
    }

    // READ (single)
    @Transactional(readOnly = true)
    public ProjectResponse get(Long userId, Long projectId) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        return snapshots.load(ctx.project()).toProject();
    }

    // UPDATE
    public ProjectResponse update(Long userId, Long projectId, ProjectRequest req) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        Project project = ctx.project();
        WorkStatus oldStatus = project.getStatus() == null ? WorkStatus.PENDING : project.getStatus();

        List<String> changes = new ArrayList<>();
        Text.diff(changes, "title", project.getTitle(), Text.clean(req.title()));
        Text.diff(changes, "type", project.getType(), Text.clean(req.type()));
        Text.diff(changes, "adviser", project.getAdviser(), Text.clean(req.adviser()));
        Text.diff(changes, "semester", project.getSemester(), Text.clean(req.semester()));
        Text.diff(changes, "subject/section", project.getSubjectSection(), Text.clean(req.subjectSection()));
        Text.diff(changes, "deadline", project.getDeadline(), req.deadline());
        Text.diffQuiet(changes, "description", project.getDescription(), Text.clean(req.description()));
        Text.diffQuiet(changes, "start date", project.getStartDate(), Text.clean(req.startDate()));

        apply(project, req);
        if (req.status() != null) {
            project.setStatus(req.status());
        }
        projects.save(project);

        if (!changes.isEmpty()) {
            history.entry(project, ctx.user(), HistoryType.PROJECT,
                    "Updated project details (" + String.join("; ", changes) + ")").save();
        }
        if (req.status() != null && req.status() != oldStatus) {
            history.entry(project, ctx.user(), HistoryType.STATUS_CHANGE,
                            "Project status changed from " + oldStatus.getLabel() + " to " + req.status().getLabel())
                    .values(oldStatus.getLabel(), req.status().getLabel())
                    .save();
        }
        return snapshots.load(project).toProject();
    }

    // DELETE: archives the project. Components, feedback, tasks and history are kept.
    public void delete(Long userId, Long projectId) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        Project project = ctx.project();
        if (project.getOwner() == null || !project.getOwner().getId().equals(ctx.user().getId())) {
            throw new ForbiddenException("Only the project owner can delete the project.");
        }
        project.setArchived(true);
        projects.save(project);
        history.entry(project, ctx.user(), HistoryType.PROJECT, "Deleted (archived) project \"" + project.getTitle() + "\"").save();
    }

    private void apply(Project project, ProjectRequest req) {
        project.setTitle(Text.clean(req.title()));
        project.setType(Text.clean(req.type()));
        project.setAdviser(Text.clean(req.adviser()));
        project.setStartDate(Text.clean(req.startDate()));
        project.setDescription(Text.clean(req.description()));
        project.setSemester(Text.clean(req.semester()));
        project.setSubjectSection(Text.clean(req.subjectSection()));
        project.setDeadline(req.deadline());
    }

    private void addMember(Project project, User user, String name, String email, String role) {
        ProjectMember m = new ProjectMember();
        m.setProject_id(project);
        m.setUser_id(user);
        m.setName(name);
        m.setEmail(email);
        m.setRole(role);
        members.save(m);
    }
}
