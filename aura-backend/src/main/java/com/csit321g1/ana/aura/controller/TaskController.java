package com.csit321g1.ana.aura.controller;

import com.csit321g1.ana.aura.dto.TaskDtos.TaskRequest;
import com.csit321g1.ana.aura.dto.TaskDtos.TaskResponse;
import com.csit321g1.ana.aura.dto.TaskDtos.TaskStatusRequest;
import com.csit321g1.ana.aura.service.TaskService;
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
@RequestMapping("/api/projects/{projectId}/tasks")
public class TaskController {

    private final TaskService service;

    public TaskController(TaskService service) {
        this.service = service;
    }

    // POST /api/projects/{id}/tasks - body may carry feedbackId (linked task) or componentId (general task)
    @PostMapping
    public ResponseEntity<TaskResponse> create(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @Valid @RequestBody TaskRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(userId, projectId, body, null));
    }

    // GET /api/projects/{id}/tasks?status=To Do&assigneeId=2&mine=true&componentId=&feedbackId=&dueFrom=&dueTo=&overdue=true&q=
    @GetMapping
    public ResponseEntity<List<TaskResponse>> list(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "assigneeId", required = false) Long assigneeId,
            @RequestParam(name = "mine", required = false, defaultValue = "false") boolean mine,
            @RequestParam(name = "componentId", required = false) Long componentId,
            @RequestParam(name = "feedbackId", required = false) Long feedbackId,
            @RequestParam(name = "dueFrom", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueFrom,
            @RequestParam(name = "dueTo", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueTo,
            @RequestParam(name = "overdue", required = false, defaultValue = "false") boolean overdue,
            @RequestParam(name = "q", required = false) String q) {
        return ResponseEntity.ok(service.list(userId, projectId, status, assigneeId, mine, componentId, feedbackId,
                dueFrom, dueTo, overdue, q));
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<TaskResponse> get(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @PathVariable("taskId") Long taskId) {
        return ResponseEntity.ok(service.get(userId, projectId, taskId));
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<TaskResponse> update(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @PathVariable("taskId") Long taskId,
            @Valid @RequestBody TaskRequest body) {
        return ResponseEntity.ok(service.update(userId, projectId, taskId, body));
    }

    @PatchMapping("/{taskId}/status")
    public ResponseEntity<TaskResponse> setStatus(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @PathVariable("taskId") Long taskId,
            @Valid @RequestBody TaskStatusRequest body) {
        return ResponseEntity.ok(service.setStatus(userId, projectId, taskId, body));
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<Map<String, String>> delete(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @PathVariable("taskId") Long taskId) {
        service.delete(userId, projectId, taskId);
        return ResponseEntity.ok(Map.of("message", "Task deleted successfully"));
    }
}
