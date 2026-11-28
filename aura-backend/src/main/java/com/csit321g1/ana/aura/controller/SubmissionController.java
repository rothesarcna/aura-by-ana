package com.csit321g1.ana.aura.controller;

import com.csit321g1.ana.aura.dto.SubmissionDtos.SubmissionRequest;
import com.csit321g1.ana.aura.dto.SubmissionDtos.SubmissionResponse;
import com.csit321g1.ana.aura.service.SubmissionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}")
public class SubmissionController {

    private final SubmissionService service;

    public SubmissionController(SubmissionService service) {
        this.service = service;
    }

    @PostMapping("/components/{componentId}/submissions")
    public ResponseEntity<SubmissionResponse> create(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable Long projectId, @PathVariable Long componentId,
            @Valid @RequestBody SubmissionRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.add(userId, projectId, componentId, body));
    }

    @GetMapping("/submissions")
    public ResponseEntity<List<SubmissionResponse>> list(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable Long projectId) {
        return ResponseEntity.ok(service.listForProject(userId, projectId));
    }
}