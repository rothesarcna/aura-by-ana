package com.csit321g1.ana.aura.controller;

import com.csit321g1.ana.aura.service.ProjectReportService;
import com.csit321g1.ana.aura.service.ProjectReportService.ReportResponse;
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
import java.util.Map;

@RestController
@RequestMapping("/api/projects/{projectId}/reports")
public class ProjectReportController {

    private final ProjectReportService service;

    public ProjectReportController(ProjectReportService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ReportResponse> create(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable Long projectId,
            @RequestBody(required = false) Map<String, String> body) {
        String type = body == null ? null : body.get("reportType");
        return ResponseEntity.status(HttpStatus.CREATED).body(service.generate(userId, projectId, type));
    }

    @GetMapping
    public List<ReportResponse> list(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable Long projectId) {
        return service.list(userId, projectId);
    }
}