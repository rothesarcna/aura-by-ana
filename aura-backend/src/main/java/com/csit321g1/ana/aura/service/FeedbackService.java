package com.csit321g1.ana.aura.service;

import com.csit321g1.ana.aura.dto.FeedbackDtos.FeedbackDetailResponse;
import com.csit321g1.ana.aura.dto.FeedbackDtos.FeedbackRequest;
import com.csit321g1.ana.aura.dto.FeedbackDtos.FeedbackResponse;
import com.csit321g1.ana.aura.dto.FeedbackDtos.FeedbackStatusRequest;
import com.csit321g1.ana.aura.dto.FeedbackDtos.ReplyRequest;
import com.csit321g1.ana.aura.dto.FeedbackDtos.ReplyResponse;
import com.csit321g1.ana.aura.dto.FeedbackDtos.ReviseRequest;
import com.csit321g1.ana.aura.dto.FeedbackDtos.VersionSummary;
import com.csit321g1.ana.aura.dto.TaskDtos.TaskResponse;
import com.csit321g1.ana.aura.exception.BadRequestException;
import com.csit321g1.ana.aura.model.Feedback;
import com.csit321g1.ana.aura.model.FeedbackReply;
import com.csit321g1.ana.aura.model.FeedbackStatus;
import com.csit321g1.ana.aura.model.FeedbackType;
import com.csit321g1.ana.aura.model.HistoryType;
import com.csit321g1.ana.aura.model.ProjectComponent;
import com.csit321g1.ana.aura.model.TaskStatus;
import com.csit321g1.ana.aura.repository.FeedbackReplyRepository;
import com.csit321g1.ana.aura.repository.FeedbackRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class FeedbackService {

    private final FeedbackRepository feedbackRepo;
    private final FeedbackReplyRepository replies;
    private final AccessService access;
    private final SnapshotService snapshots;
    private final HistoryService history;

    public FeedbackService(FeedbackRepository feedbackRepo,
                           FeedbackReplyRepository replies,
                           AccessService access,
                           SnapshotService snapshots,
                           HistoryService history) {
        this.feedbackRepo = feedbackRepo;
        this.replies = replies;
        this.access = access;
        this.snapshots = snapshots;
        this.history = history;
    }

    // CREATE: record feedback (or a clarification question) against one component
    public FeedbackResponse create(Long userId, Long projectId, FeedbackRequest req) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        ProjectComponent component = access.component(projectId, req.componentId());

        FeedbackType type = req.type() == null ? FeedbackType.FEEDBACK : req.type();
        String givenBy = Text.clean(req.givenBy());
        if (givenBy == null) {
            givenBy = type == FeedbackType.CLARIFICATION ? ctx.user().getFullName() : ctx.project().getAdviser();
        }

        Feedback f = new Feedback();
        f.setProject(ctx.project());
        f.setComponent_id(component);
        f.setType(type);
        f.setText(req.text().trim());
        f.setGivenBy(givenBy);
        f.setReceivedOn(req.receivedOn() == null ? LocalDate.now() : req.receivedOn());
        f.setStatus(FeedbackStatus.OPEN);
        f.setVersionNumber(1);
        f.setRecorded_by_id(ctx.user());
        f = feedbackRepo.save(f);

        String label = type == FeedbackType.CLARIFICATION ? "Clarification question" : "Feedback";
        history.entry(ctx.project(), ctx.user(), HistoryType.FEEDBACK,
                        label + " recorded on \"" + component.getName() + "\": " + Text.snippet(f.getText(), 120))
                .component(component)
                .feedback(f)
                .save();
        return snapshots.load(ctx.project()).toFeedback(f);
    }

    /**
     * Search and filter. All parameters are optional. Superseded versions are left out unless you
     * ask for them with includeSuperseded=true or status=Superseded. Newest first.
     */
    @Transactional(readOnly = true)
    public List<FeedbackResponse> list(Long userId, Long projectId, Long componentId, String status, String type,
                                       LocalDate from, LocalDate to, String q, boolean includeSuperseded) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        FeedbackStatus wantedStatus = Filters.parseEnum(FeedbackStatus.class, "status", status);
        FeedbackType wantedType = Filters.parseEnum(FeedbackType.class, "type", type);
        Filters.checkRange(from, to);

        ProjectSnapshot snap = snapshots.load(ctx.project());
        return snap.feedback().stream()
                .filter(f -> componentId == null || f.getComponent_id().getId().equals(componentId))
                .filter(f -> wantedStatus != null
                        ? f.getStatus() == wantedStatus
                        : includeSuperseded || f.getStatus() != FeedbackStatus.SUPERSEDED)
                .filter(f -> wantedType == null || f.getType() == wantedType)
                .filter(f -> Filters.inRange(f.getReceivedOn(), from, to))
                .filter(f -> Filters.matches(q, f.getText(), f.getGivenBy()))
                .sorted(Comparator.comparing(Feedback::getReceivedOn, Comparator.nullsLast(Comparator.<LocalDate>reverseOrder()))
                        .thenComparing(Feedback::getId, Comparator.reverseOrder()))
                .map(snap::toFeedback)
                .collect(Collectors.toList());
    }

    /** One feedback record with its linked tasks, replies and the full version chain. */
    @Transactional(readOnly = true)
    public FeedbackDetailResponse get(Long userId, Long projectId, Long feedbackId) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        Feedback f = access.feedback(projectId, feedbackId);
        return detail(snapshots.load(ctx.project()), f);
    }

    /**
     * The instructor changed their instructions. The old record is kept and marked Superseded, and a
     * new Open record (version + 1) takes its place. Tasks already linked stay on the old version.
     */
    public FeedbackDetailResponse revise(Long userId, Long projectId, Long feedbackId, ReviseRequest req) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        Feedback old = access.feedback(projectId, feedbackId);
        if (old.getStatus() == FeedbackStatus.SUPERSEDED) {
            throw new BadRequestException("This feedback was already replaced by a newer version. Revise the latest version.");
        }

        String givenBy = Text.clean(req.givenBy()) == null ? old.getGivenBy() : Text.clean(req.givenBy());

        Feedback next = new Feedback();
        next.setProject(old.getProject());
        next.setComponent_id(old.getComponent_id());
        next.setType(old.getType());
        next.setText(req.text().trim());
        next.setGivenBy(givenBy);
        next.setReceivedOn(req.receivedOn() == null ? LocalDate.now() : req.receivedOn());
        next.setStatus(FeedbackStatus.OPEN);
        next.setVersionNumber(old.getVersionNumber() + 1);
        next.setPreviousFeedback(old);
        next.setRecorded_by_id(ctx.user());
        next = feedbackRepo.save(next);

        old.setStatus(FeedbackStatus.SUPERSEDED);
        feedbackRepo.save(old);

        ProjectSnapshot snap = snapshots.load(ctx.project());
        long openOnOld = snap.tasksOf(old.getId()).stream().filter(t -> t.getStatus() != TaskStatus.DONE).count();
        String reason = Text.clean(req.reason());
        String message = "Instructions changed on \"" + old.getComponent_id().getName() + "\" (version "
                + old.getVersionNumber() + " \u2192 " + next.getVersionNumber() + ")"
                + (reason == null ? "" : ": " + reason)
                + (openOnOld == 0 ? "" : ". " + openOnOld + " unfinished task(s) are still linked to the previous version");
        history.entry(ctx.project(), ctx.user(), HistoryType.FEEDBACK, message)
                .component(old.getComponent_id())
                .feedback(next)
                .values("v" + old.getVersionNumber(), "v" + next.getVersionNumber())
                .save();

        return detail(snap, next);
    }

    /** Mark feedback Resolved or reopen it. Superseded versions cannot be changed. */
    public FeedbackResponse setStatus(Long userId, Long projectId, Long feedbackId, FeedbackStatusRequest req) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        Feedback f = access.feedback(projectId, feedbackId);

        if (req.status() == FeedbackStatus.SUPERSEDED) {
            throw new BadRequestException("Superseded is set automatically when you revise feedback.");
        }
        if (f.getStatus() == FeedbackStatus.SUPERSEDED) {
            throw new BadRequestException("This version was replaced by a newer one and can no longer be changed.");
        }

        FeedbackStatus before = f.getStatus();
        if (before != req.status()) {
            f.setStatus(req.status());
            f.setResolvedAt(req.status() == FeedbackStatus.RESOLVED ? Instant.now() : null);
            feedbackRepo.save(f);
            history.entry(ctx.project(), ctx.user(), HistoryType.STATUS_CHANGE,
                            (req.status() == FeedbackStatus.RESOLVED ? "Resolved" : "Reopened") + " feedback on \""
                                    + f.getComponent_id().getName() + "\": " + Text.snippet(f.getText(), 100))
                    .component(f.getComponent_id())
                    .feedback(f)
                    .values(before.getLabel(), req.status().getLabel())
                    .save();
        }
        return snapshots.load(ctx.project()).toFeedback(f);
    }

    /** Adds a note, e.g. the instructor's answer to a clarification question. */
    public ReplyResponse addReply(Long userId, Long projectId, Long feedbackId, ReplyRequest req) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        Feedback f = access.feedback(projectId, feedbackId);

        FeedbackReply r = new FeedbackReply();
        r.setFeedback(f);
        r.setAuthor_id(ctx.user());
        r.setAuthorName(ctx.user().getFullName());
        r.setText(req.text().trim());
        r = replies.save(r);

        String what = f.getType() == FeedbackType.CLARIFICATION ? "clarification" : "feedback";
        history.entry(ctx.project(), ctx.user(), HistoryType.FEEDBACK,
                        "Added a note to " + what + " on \"" + f.getComponent_id().getName() + "\": " + Text.snippet(r.getText(), 100))
                .component(f.getComponent_id())
                .feedback(f)
                .save();
        return toReply(r);
    }

    // ---- helpers --------------------------------------------------------

    private FeedbackDetailResponse detail(ProjectSnapshot snap, Feedback f) {
        List<TaskResponse> tasks = snap.tasksOf(f.getId()).stream()
                .map(snap::toTask)
                .collect(Collectors.toList());
        List<ReplyResponse> replyList = replies.findByFeedbackIdOrderByCreatedAtAscIdAsc(f.getId()).stream()
                .map(this::toReply)
                .collect(Collectors.toList());
        return new FeedbackDetailResponse(snap.toFeedback(f), tasks, replyList, versionChain(f));
    }

    /** Oldest version first. Walks back to the first version, then forward through newer ones. */
    private List<VersionSummary> versionChain(Feedback current) {
        Feedback first = current;
        while (first.getPreviousFeedback() != null) {
            first = first.getPreviousFeedback();
        }
        List<VersionSummary> chain = new ArrayList<>();
        Feedback cursor = first;
        while (cursor != null) {
            chain.add(new VersionSummary(
                    cursor.getId(),
                    cursor.getVersionNumber(),
                    cursor.getStatus(),
                    cursor.getText(),
                    cursor.getGivenBy(),
                    cursor.getReceivedOn(),
                    cursor.getCreatedAt()));
            Optional<Feedback> newer = feedbackRepo.findFirstByPreviousFeedbackId(cursor.getId());
            cursor = newer.orElse(null);
        }
        return Collections.unmodifiableList(chain);
    }

    private ReplyResponse toReply(FeedbackReply r) {
        return new ReplyResponse(r.getId(), r.getAuthorName(), r.getText(), r.getCreatedAt());
    }
}
