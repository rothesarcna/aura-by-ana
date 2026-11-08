package com.csit321g1.ana.aura.controller;

import com.csit321g1.ana.aura.dto.FeedbackDtos.FeedbackDetailResponse;
import com.csit321g1.ana.aura.dto.FeedbackDtos.FeedbackRequest;
import com.csit321g1.ana.aura.dto.FeedbackDtos.FeedbackResponse;
import com.csit321g1.ana.aura.dto.FeedbackDtos.FeedbackStatusRequest;
import com.csit321g1.ana.aura.dto.FeedbackDtos.ReplyRequest;
import com.csit321g1.ana.aura.dto.FeedbackDtos.ReplyResponse;
import com.csit321g1.ana.aura.dto.FeedbackDtos.ReviseRequest;
import com.csit321g1.ana.aura.dto.TaskDtos.TaskRequest;
import com.csit321g1.ana.aura.dto.TaskDtos.TaskResponse;
import com.csit321g1.ana.aura.service.FeedbackService;
import com.csit321g1.ana.aura.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Feedback is never edited in place or deleted. To change the instructions use /revise, which keeps the
 * old record (marked Superseded) and creates a new version.
 */
@RestController
@RequestMapping("/api/projects/{projectId}/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;
    private final TaskService taskService;

    public FeedbackController(FeedbackService feedbackService, TaskService taskService) {
        this.feedbackService = feedbackService;
        this.taskService = taskService;
    }

    @PostMapping
    public ResponseEntity<FeedbackResponse> create(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @Valid @RequestBody FeedbackRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(feedbackService.create(userId, projectId, body));
    }

    // GET /api/projects/{id}/feedback?componentId=&status=Open&type=Clarification&from=&to=&q=&includeSuperseded=false
    @GetMapping
    public ResponseEntity<List<FeedbackResponse>> list(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @RequestParam(name = "componentId", required = false) Long componentId,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "type", required = false) String type,
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "includeSuperseded", required = false, defaultValue = "false") boolean includeSuperseded) {
        return ResponseEntity.ok(
                feedbackService.list(userId, projectId, componentId, status, type, from, to, q, includeSuperseded));
    }

    @GetMapping("/{feedbackId}")
    public ResponseEntity<FeedbackDetailResponse> get(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @PathVariable("feedbackId") Long feedbackId) {
        return ResponseEntity.ok(feedbackService.get(userId, projectId, feedbackId));
    }

    // POST /api/projects/{id}/feedback/{fid}/revise - the instructor changed their instructions
    @PostMapping("/{feedbackId}/revise")
    public ResponseEntity<FeedbackDetailResponse> revise(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @PathVariable("feedbackId") Long feedbackId,
            @Valid @RequestBody ReviseRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(feedbackService.revise(userId, projectId, feedbackId, body));
    }

    // PATCH /api/projects/{id}/feedback/{fid}/status - Open or Resolved
    @PatchMapping("/{feedbackId}/status")
    public ResponseEntity<FeedbackResponse> setStatus(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @PathVariable("feedbackId") Long feedbackId,
            @Valid @RequestBody FeedbackStatusRequest body) {
        return ResponseEntity.ok(feedbackService.setStatus(userId, projectId, feedbackId, body));
    }

    @PostMapping("/{feedbackId}/replies")
    public ResponseEntity<ReplyResponse> addReply(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @PathVariable("feedbackId") Long feedbackId,
            @Valid @RequestBody ReplyRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(feedbackService.addReply(userId, projectId, feedbackId, body));
    }

    // ---- revision tasks linked to this feedback ----

    @GetMapping("/{feedbackId}/tasks")
    public ResponseEntity<List<TaskResponse>> tasks(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @PathVariable("feedbackId") Long feedbackId) {
        return ResponseEntity.ok(taskService.listForFeedback(userId, projectId, feedbackId));
    }

    // POST /api/projects/{id}/feedback/{fid}/tasks - turn this feedback into a linked revision task
    @PostMapping("/{feedbackId}/tasks")
    public ResponseEntity<TaskResponse> createTask(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @PathVariable("feedbackId") Long feedbackId,
            @Valid @RequestBody TaskRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.create(userId, projectId, body, feedbackId));
    }
}
