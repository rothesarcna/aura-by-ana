package com.csit321g1.ana.aura.service;

import com.csit321g1.ana.aura.model.Feedback;
import com.csit321g1.ana.aura.model.FeedbackStatus;
import com.csit321g1.ana.aura.model.FeedbackType;
import com.csit321g1.ana.aura.model.ProjectReport;
import com.csit321g1.ana.aura.model.TaskStatus;
import com.csit321g1.ana.aura.repository.ProjectReportRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProjectReportService {

    public record ReportResponse(Long id, String reportType, Instant generatedAt, String generatedBy, String data) {
    }

    private final ProjectReportRepository reports;
    private final AccessService access;
    private final SnapshotService snapshots;
    private final HistoryService history;

    public ProjectReportService(ProjectReportRepository reports, AccessService access,
                                SnapshotService snapshots, HistoryService history) {
        this.reports = reports;
        this.access = access;
        this.snapshots = snapshots;
        this.history = history;
    }

    public ReportResponse generate(Long userId, Long projectId, String reportType) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        ProjectSnapshot snap = snapshots.load(ctx.project());
        StringBuilder sb = new StringBuilder();

        sb.append("REVISION HISTORY REPORT: ").append(ctx.project().getTitle()).append('\n')
          .append("Generated ").append(LocalDate.now()).append('\n')
          .append("Overall progress: ").append(snap.overallProgress()).append("%\n\n");

        sb.append("FEEDBACK RECEIVED\n");
        for (Feedback f : snap.feedback()) {
            sb.append("- [").append(f.getStatus().getLabel()).append("] ")
              .append(f.getComponent_id().getName()).append(" v").append(f.getVersionNumber()).append(": ")
              .append(Text.snippet(f.getText(), 160)).append('\n');
        }

        sb.append("\nREVISIONS DOCUMENTED\n");
        history.list(userId, projectId, "Revision", null, null, null, null, null, null).forEach(h ->
                sb.append("- ").append(h.message()).append(" (").append(h.actorName()).append(")\n"));

        long done = snap.tasks().stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
        sb.append("\nREVISION TASKS\n").append(done).append(" of ").append(snap.tasks().size()).append(" completed\n");
        snap.tasks().stream().filter(t -> t.getStatus() != TaskStatus.DONE).forEach(t ->
                sb.append("- OPEN: ").append(t.getTitle()).append(" (").append(t.getComponent_id().getName()).append(")\n"));

        sb.append("\nRECURRING ISSUES (3 or more feedback records on one component)\n");
        snap.feedback().stream()
                .filter(f -> f.getType() == FeedbackType.FEEDBACK)
                .collect(Collectors.groupingBy(f -> f.getComponent_id().getName(), Collectors.counting()))
                .forEach((name, n) -> {
                    if (n >= 3) sb.append("- ").append(name).append(": ").append(n).append(" records\n");
                });

        sb.append("\nUNRESOLVED\n");
        snap.feedback().stream().filter(f -> f.getStatus() == FeedbackStatus.OPEN).forEach(f ->
                sb.append("- ").append(f.getComponent_id().getName()).append(": ")
                  .append(Text.snippet(f.getText(), 120)).append('\n'));

        ProjectReport r = new ProjectReport();
        r.setProject(ctx.project());
        r.setGeneratedBy(ctx.member());
        r.setReportType(reportType == null || reportType.isBlank() ? "REVISION_SUMMARY" : reportType);
        r.setReportData(sb.toString());
        return toResponse(reports.save(r));
    }

    @Transactional(readOnly = true)
    public List<ReportResponse> list(Long userId, Long projectId) {
        access.require(projectId, userId);
        return reports.findByProjectIdOrderByGeneratedAtDesc(projectId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    private ReportResponse toResponse(ProjectReport r) {
        return new ReportResponse(r.getId(), r.getReportType(), r.getGeneratedAt(),
                r.getGeneratedBy() == null ? null : r.getGeneratedBy().getName(), r.getReportData());
    }
}