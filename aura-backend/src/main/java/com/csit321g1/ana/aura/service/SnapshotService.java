package com.csit321g1.ana.aura.service;

import com.csit321g1.ana.aura.model.Project;
import com.csit321g1.ana.aura.repository.FeedbackReplyRepository;
import com.csit321g1.ana.aura.repository.FeedbackRepository;
import com.csit321g1.ana.aura.repository.ProjectComponentRepository;
import com.csit321g1.ana.aura.repository.ProjectMemberRepository;
import com.csit321g1.ana.aura.repository.RevisionTaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@Transactional(readOnly = true)
public class SnapshotService {

    private final ProjectMemberRepository members;
    private final ProjectComponentRepository components;
    private final FeedbackRepository feedback;
    private final FeedbackReplyRepository replies;
    private final RevisionTaskRepository tasks;

    public SnapshotService(ProjectMemberRepository members,
                           ProjectComponentRepository components,
                           FeedbackRepository feedback,
                           FeedbackReplyRepository replies,
                           RevisionTaskRepository tasks) {
        this.members = members;
        this.components = components;
        this.feedback = feedback;
        this.replies = replies;
        this.tasks = tasks;
    }

    /** Call from inside a transaction; the snapshot reads lazy associations when it maps. */
    public ProjectSnapshot load(Project project) {
        Long id = project.getId();
        return new ProjectSnapshot(
                project,
                LocalDate.now(),
                members.findByProjectIdOrderByIdAsc(id),
                components.findByProjectId(id),
                feedback.findByProjectId(id),
                replies.findByFeedbackProjectIdOrderByCreatedAtAscIdAsc(id),
                tasks.findByProjectIdAndArchivedFalse(id));
    }
}
