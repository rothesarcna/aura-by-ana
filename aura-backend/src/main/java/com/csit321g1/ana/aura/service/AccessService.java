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
import com.csit321g1.ana.aura.repository.ProjectRepository; // Fixed import
import com.csit321g1.ana.aura.repository.RevisionTaskRepository;
import com.csit321g1.ana.aura.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AccessService {

    public record ProjectAccess(User user, Project project, ProjectMember member) {
    }

    private final UserRepository users;
    private final ProjectRepository projects; // Fixed from ProjectReportRepository
    private final ProjectMemberRepository members;
    private final ProjectComponentRepository components;
    private final FeedbackRepository feedback;
    private final RevisionTaskRepository tasks;

    public AccessService(UserRepository users,
                         ProjectRepository projects, // Fixed injection
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
        if (f.getComponent_id().isArchived()) { // Fixed from getComponent_id() to getComponent()
            throw new NotFoundException("Feedback not found in this project.");
        }
        return f;
    }

    public RevisionTask task(Long projectId, Long taskId) {
        return tasks.findByIdAndProjectIdAndArchivedFalse(taskId, projectId)
                .orElseThrow(() -> new NotFoundException("Task not found in this project."));
    }

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