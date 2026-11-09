package com.csit321g1.ana.aura.controller;

import com.csit321g1.ana.aura.model.ProjectReport;
import com.csit321g1.ana.aura.service.ProjectReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects/{projectId}/reports")
public class ProjectReportController {

    @Autowired
    private ProjectReportService reportService;

    @PostMapping
    public ResponseEntity<?> createReport(@PathVariable Long projectId, @RequestBody Map<String, Object> payload) {
        try {
            Long userId = Long.valueOf(payload.get("generatedById").toString());
            String type = payload.get("reportType").toString();
            String data = payload.getOrDefault("reportData", "").toString();
            
            return ResponseEntity.ok(reportService.generateReport(projectId, userId, type, data));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<ProjectReport>> getProjectReports(@PathVariable Long projectId) {
        return ResponseEntity.ok(reportService.getReportsForProject(projectId));
    }
}