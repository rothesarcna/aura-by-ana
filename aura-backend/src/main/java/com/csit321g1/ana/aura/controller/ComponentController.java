package com.csit321g1.ana.aura.controller;

import com.csit321g1.ana.aura.dto.ComponentDtos.ComponentRequest;
import com.csit321g1.ana.aura.dto.ComponentDtos.ComponentResponse;
import com.csit321g1.ana.aura.dto.ComponentDtos.StatusChangeRequest;
import com.csit321g1.ana.aura.service.ComponentService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects/{projectId}/components")
public class ComponentController {

    private final ComponentService service;

    public ComponentController(ComponentService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ComponentResponse> create(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @Valid @RequestBody ComponentRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(userId, projectId, body));
    }

    // GET /api/projects/{id}/components?status=For Revision&dueFrom=2026-11-01&dueTo=2026-11-30&ownerId=3&q=chapter
    @GetMapping
    public ResponseEntity<List<ComponentResponse>> list(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "dueFrom", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueFrom,
            @RequestParam(name = "dueTo", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueTo,
            @RequestParam(name = "ownerId", required = false) Long ownerId,
            @RequestParam(name = "q", required = false) String q) {
        return ResponseEntity.ok(service.list(userId, projectId, status, dueFrom, dueTo, ownerId, q));
    }

    @GetMapping("/{componentId}")
    public ResponseEntity<ComponentResponse> get(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @PathVariable("componentId") Long componentId) {
        return ResponseEntity.ok(service.get(userId, projectId, componentId));
    }

    @PutMapping("/{componentId}")
    public ResponseEntity<ComponentResponse> update(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @PathVariable("componentId") Long componentId,
            @Valid @RequestBody ComponentRequest body) {
        return ResponseEntity.ok(service.update(userId, projectId, componentId, body));
    }

    @PatchMapping("/{componentId}/status")
    public ResponseEntity<ComponentResponse> changeStatus(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @PathVariable("componentId") Long componentId,
            @Valid @RequestBody StatusChangeRequest body) {
        return ResponseEntity.ok(service.changeStatus(userId, projectId, componentId, body));
    }

    @DeleteMapping("/{componentId}")
    public ResponseEntity<Map<String, String>> delete(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @PathVariable("componentId") Long componentId) {
        service.delete(userId, projectId, componentId);
        return ResponseEntity.ok(Map.of("message", "Component deleted successfully"));
    }
}
