package com.csit321g1.ana.aura.service;

import com.csit321g1.ana.aura.model.Feedback;
import com.csit321g1.ana.aura.model.FeedbackStatus;
import com.csit321g1.ana.aura.model.FeedbackType;
import com.csit321g1.ana.aura.model.Project;
import com.csit321g1.ana.aura.model.ProjectComponent;
import com.csit321g1.ana.aura.model.RevisionTask;
import com.csit321g1.ana.aura.model.TaskStatus;
import com.csit321g1.ana.aura.model.User;
import com.csit321g1.ana.aura.model.WorkStatus;
import com.csit321g1.ana.aura.repository.FeedbackRepository;
import com.csit321g1.ana.aura.repository.ProjectComponentRepository;
import com.csit321g1.ana.aura.repository.ProjectRepository;
import com.csit321g1.ana.aura.repository.RevisionTaskRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/** Every morning: upcoming deadlines, overdue tasks and clarification questions nobody has answered. */
@Component
public class ReminderJob {

    private final ProjectRepository projects;
    private final RevisionTaskRepository tasks;
    private final ProjectComponentRepository components;
    private final FeedbackRepository feedback;
    private final NotificationService notifications;

    public ReminderJob(ProjectRepository projects, RevisionTaskRepository tasks,
                       ProjectComponentRepository components, FeedbackRepository feedback,
                       NotificationService notifications) {
        this.projects = projects;
        this.tasks = tasks;
        this.components = components;
        this.feedback = feedback;
        this.notifications = notifications;
    }

    @Scheduled(cron = "0 0 7 * * *")
    @Transactional
    public void run() {
        LocalDate today = LocalDate.now();
        for (Project p : projects.findAll()) {
            if (p.isArchived()) continue;

            for (RevisionTask t : tasks.findByProjectIdAndArchivedFalse(p.getId())) {
                if (t.getStatus() == TaskStatus.DONE || t.getDueDate() == null || t.getComponent_id().isArchived()) continue;
                long days = ChronoUnit.DAYS.between(today, t.getDueDate());
                if (days > 2) continue;
                String type = days < 0 ? "TASK_OVERDUE" : "TASK_DUE_SOON";
                String msg = days < 0
                        ? "Task \"" + t.getTitle() + "\" is overdue (due " + t.getDueDate() + ")"
                        : "Task \"" + t.getTitle() + "\" is due " + t.getDueDate();
                User who = t.getAssignee_id() == null ? null : t.getAssignee_id().getUser();
                if (who != null) {
                    notifications.notifyUser(who, p, type, msg);
                } else {
                    notifications.notifyProject(p, null, type, msg);
                }
            }

            for (ProjectComponent c : components.findByProjectId(p.getId())) {
                if (c.isArchived() || c.getStatus() == WorkStatus.APPROVED || c.getDueDate() == null) continue;
                if (ChronoUnit.DAYS.between(today, c.getDueDate()) <= 3) {
                    notifications.notifyProject(p, null, "DEADLINE",
                            "\"" + c.getName() + "\" is due " + c.getDueDate());
                }
            }

            Instant cutoff = Instant.now().minus(3, ChronoUnit.DAYS);
            for (Feedback f : feedback.findByProjectId(p.getId())) {
                if (f.getType() == FeedbackType.CLARIFICATION
                        && f.getStatus() == FeedbackStatus.OPEN
                        && !f.getComponent_id().isArchived()
                        && f.getCreatedAt() != null && f.getCreatedAt().isBefore(cutoff)) {
                    notifications.notifyProject(p, null, "CLARIFICATION_PENDING",
                            "Still waiting for an answer on " + f.getComponent_id().getName()
                                    + ": " + Text.snippet(f.getText(), 60));
                }
            }
        }
    }
}