package com.csit321g1.ana.aura.service;

import com.csit321g1.ana.aura.exception.BadRequestException;
import com.csit321g1.ana.aura.exception.NotFoundException;
import com.csit321g1.ana.aura.exception.UnauthorizedException;
import com.csit321g1.ana.aura.model.Feedback;
import com.csit321g1.ana.aura.model.Project;
import com.csit321g1.ana.aura.model.ProjectComponent;
import com.csit321g1.ana.aura.model.ProjectMember;
import com.csit321g1.ana.aura.model.RevisionTask;
import com.csit321g1.ana.aura.model.User;
import com.csit321g1.ana.aura.repository.FeedbackRepository;
import com.csit321g1.ana.aura.repository.ProjectComponentRepository;
import com.csit321g1.ana.aura.repository.ProjectMemberRepository;
import com.csit321g1.ana.aura.repository.ProjectRepository;
import com.csit321g1.ana.aura.repository.RevisionTaskRepository;
import com.csit321g1.ana.aura.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Decides who the caller is and whether they may touch a project, and looks up records that must
 * belong to that project.
 *
 * Group collaboration rule: only an active member of a project (a member linked to the caller's
 * account) can read or change anything in it. Non-members get a plain 404 so project ids cannot
 * be probed.
 */
@Service
@Transactional(readOnly = true)
public class AccessService {

    /** The caller, the project, and the caller's membership in it. */
    public record ProjectAccess(User user, Project project, ProjectMember member) {
    }

    private final UserRepository users;
    private final ProjectRepository projects;
    private final ProjectMemberRepository members;
    private final ProjectComponentRepository components;
    private final FeedbackRepository feedback;
    private final RevisionTaskRepository tasks;

    public AccessService(UserRepository users,
                         ProjectRepository projects,
                         ProjectMemberRepository members,
                         ProjectComponentRepository components,
                         FeedbackRepository feedback,
                         RevisionTaskRepository tasks) {
        this.users = users;
        this.projects = projects;
        this.members = members;
        this.components = components;
        this.feedback = feedback;
        this.tasks = tasks;
    }

    public User requireUser(Long userId) {
        if (userId == null) {
            throw new UnauthorizedException("Missing X-User-Id header. Sign in first.");
        }
        return users.findById(userId).orElseThrow(() -> new UnauthorizedException("Unknown user. Sign in again."));
    }

    public ProjectAccess require(Long projectId, Long userId) {
        User user = requireUser(userId);
        Project project = projects.findById(projectId)
                .filter(p -> !p.isArchived())
                .orElseThrow(() -> new NotFoundException("Project not found."));
        ProjectMember member = members.findByProjectIdAndUserIdAndActiveTrue(projectId, user.getId())
                .orElseThrow(() -> new NotFoundException("Project not found."));
        return new ProjectAccess(user, project, member);
    }

    public ProjectComponent component(Long projectId, Long componentId) {
        if (componentId == null) {
            throw new BadRequestException("componentId is required.");
        }
        return components.findByIdAndProjectIdAndArchivedFalse(componentId, projectId)
                .orElseThrow(() -> new NotFoundException("Component not found in this project."));
    }

    public Feedback feedback(Long projectId, Long feedbackId) {
        Feedback f = feedback.findByIdAndProjectId(feedbackId, projectId)
                .orElseThrow(() -> new NotFoundException("Feedback not found in this project."));
        if (f.getComponent().isArchived()) {
            throw new NotFoundException("Feedback not found in this project.");
        }
        return f;
    }

    public RevisionTask task(Long projectId, Long taskId) {
        return tasks.findByIdAndProjectIdAndArchivedFalse(taskId, projectId)
                .orElseThrow(() -> new NotFoundException("Task not found in this project."));
    }

    /** A member that tasks or components can be assigned to; must be active in this project. */
    public ProjectMember assignee(Long projectId, Long memberId) {
        if (memberId == null) {
            return null;
        }
        return members.findByIdAndProjectId(memberId, projectId)
                .filter(ProjectMember::isActive)
                .orElseThrow(() -> new BadRequestException("The assignee must be an active member of this project."));
    }

    public ProjectMember member(Long projectId, Long memberId) {
        return members.findByIdAndProjectId(memberId, projectId)
                .filter(ProjectMember::isActive)
                .orElseThrow(() -> new NotFoundException("Member not found in this project."));
    }
}
