package com.csit321g1.ana.aura.service;

import com.csit321g1.ana.aura.dto.SubmissionDtos.SubmissionRequest;
import com.csit321g1.ana.aura.dto.SubmissionDtos.SubmissionResponse;
import com.csit321g1.ana.aura.model.HistoryType;
import com.csit321g1.ana.aura.model.ProjectComponent;
import com.csit321g1.ana.aura.model.Submission;
import com.csit321g1.ana.aura.model.WorkStatus;
import com.csit321g1.ana.aura.repository.ProjectComponentRepository;
import com.csit321g1.ana.aura.repository.SubmissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class SubmissionService {

    private final SubmissionRepository submissions;
    private final ProjectComponentRepository components;
    private final AccessService access;
    private final HistoryService history;

    public SubmissionService(SubmissionRepository submissions, ProjectComponentRepository components,
                             AccessService access, HistoryService history) {
        this.submissions = submissions;
        this.components = components;
        this.access = access;
        this.history = history;
    }

    /** Records a submission (or resubmission after "For Revision") and moves the component's status. */
    public SubmissionResponse add(Long userId, Long projectId, Long componentId, SubmissionRequest req) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        ProjectComponent c = access.component(projectId, componentId);

        WorkStatus before = c.getStatus();
        WorkStatus after = before == WorkStatus.FOR_REVISION ? WorkStatus.RESUBMITTED : WorkStatus.SUBMITTED;

        Submission s = new Submission();
        s.setComponent(c);
        s.setSubmission_reference(req.reference().trim());
        s.setSubmission_notes(Text.clean(req.notes()));
        s.setVersion_number(submissions.findByComponent_Id(componentId).size() + 1);
        s.setStatus(after);
        s.setSubmitted_by(ctx.user());
        s = submissions.save(s);

        c.setStatus(after);
        components.save(c);

        history.entry(ctx.project(), ctx.user(), HistoryType.STATUS_CHANGE,
                        "Submitted \"" + c.getName() + "\" (version " + s.getVersion_number() + ")")
                .component(c)
                .values(before.getLabel(), after.getLabel())
                .save();
        return toResponse(s);
    }

    @Transactional(readOnly = true)
    public List<SubmissionResponse> listForProject(Long userId, Long projectId) {
        access.require(projectId, userId);
        return submissions.findByComponent_Project_Id(projectId).stream()
                .sorted(Comparator.comparing(Submission::getSubmitted_at, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private SubmissionResponse toResponse(Submission s) {
        return new SubmissionResponse(
                s.getId(),
                s.getComponent().getId(),
                s.getVersion_number(),
                s.getSubmission_reference(),
                s.getSubmission_notes(),
                s.getStatus(),
                s.getSubmitted_by() == null ? null : s.getSubmitted_by().getFullName(),
                s.getSubmitted_at());
    }
}