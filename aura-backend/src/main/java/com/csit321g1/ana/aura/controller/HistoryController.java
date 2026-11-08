package com.csit321g1.ana.aura.controller;

import com.csit321g1.ana.aura.dto.HistoryDtos.HistoryResponse;
import com.csit321g1.ana.aura.dto.HistoryDtos.RevisionRequest;
import com.csit321g1.ana.aura.service.HistoryService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/** The history is append-only: there is no update or delete endpoint on purpose. */
@RestController
@RequestMapping("/api/projects/{projectId}")
public class HistoryController {

    private final HistoryService service;

    public HistoryController(HistoryService service) {
        this.service = service;
    }

    // GET /api/projects/{id}/history?type=Revision&componentId=&feedbackId=&taskId=&from=&to=&q=
    @GetMapping("/history")
    public ResponseEntity<List<HistoryResponse>> history(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @RequestParam(name = "type", required = false) String type,
            @RequestParam(name = "componentId", required = false) Long componentId,
            @RequestParam(name = "feedbackId", required = false) Long feedbackId,
            @RequestParam(name = "taskId", required = false) Long taskId,
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(name = "q", required = false) String q) {
        return ResponseEntity.ok(service.list(userId, projectId, type, componentId, feedbackId, taskId, from, to, q));
    }

    // POST /api/projects/{id}/revisions - document a change made in response to feedback
    @PostMapping("/revisions")
    public ResponseEntity<HistoryResponse> recordRevision(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @Valid @RequestBody RevisionRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.recordRevision(userId, projectId, body));
    }
}
