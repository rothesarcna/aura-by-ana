package com.csit321g1.ana.aura.service;

import com.csit321g1.ana.aura.dto.NotificationDtos.NotificationResponse;
import com.csit321g1.ana.aura.exception.NotFoundException;
import com.csit321g1.ana.aura.model.Notification;
import com.csit321g1.ana.aura.model.Project;
import com.csit321g1.ana.aura.model.ProjectMember;
import com.csit321g1.ana.aura.model.User;
import com.csit321g1.ana.aura.repository.NotificationRepository;
import com.csit321g1.ana.aura.repository.ProjectMemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository repo;
    private final ProjectMemberRepository members;

    public NotificationService(NotificationRepository repo, ProjectMemberRepository members) {
        this.repo = repo;
        this.members = members;
    }

    /** One notification for one user. An identical one already created today is skipped. */
    public void notifyUser(User user, Project project, String type, String message) {
        if (user == null) return;
        Instant since = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();
        if (repo.existsRecent(user.getId(), type, message, since)) return;
        Notification n = new Notification();
        n.setUser(user);
        n.setProject(project);
        n.setNotification_type(type);
        n.setMessage(message);
        repo.save(n);
    }

    /** Everyone with an account in the project, except the person who caused the event. */
    public void notifyProject(Project project, User except, String type, String message) {
        for (ProjectMember m : members.findByProjectIdOrderByIdAsc(project.getId())) {
            if (m.isActive() && m.getUser() != null
                    && (except == null || !m.getUser().getId().equals(except.getId()))) {
                notifyUser(m.getUser(), project, type, message);
            }
        }
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> list(Long userId) {
        return repo.findByUser_IdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public NotificationResponse markRead(Long userId, Long id) {
        Notification n = repo.findById(id)
                .filter(x -> x.getUser().getId().equals(userId))
                .orElseThrow(() -> new NotFoundException("Notification not found."));
        if (n.getRead_at() == null) {
            n.setRead_at(Instant.now());
            n.setRead(true);
        }
        return toResponse(repo.save(n));
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getNotification_type(),
                n.getMessage(),
                n.isRead(),
                n.getCreatedAt(),
                n.getProject() == null ? null : n.getProject().getId(),
                n.getProject() == null ? null : n.getProject().getTitle());
    }
}