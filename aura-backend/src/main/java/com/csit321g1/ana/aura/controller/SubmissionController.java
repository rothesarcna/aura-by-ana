package com.csit321g1.ana.aura.controller;

import com.csit321g1.ana.aura.model.Submission;
import com.csit321g1.ana.aura.service.SubmissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/components/{componentId}/submissions")
public class SubmissionController {

    @Autowired
    private SubmissionService submissionService;

    @PostMapping
    public ResponseEntity<?> createSubmission(@PathVariable Long componentId, @RequestBody Submission submission) {
        try {
            // Assuming the frontend passes submittedBy.id inside the submission object payload
            Long userId = submission.getSubmitted_by().getId(); 
            return ResponseEntity.ok(submissionService.addSubmission(componentId, userId, submission));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<Submission>> getSubmissions(@PathVariable Long componentId) {
        return ResponseEntity.ok(submissionService.getSubmissionsForComponent(componentId));
    }
}