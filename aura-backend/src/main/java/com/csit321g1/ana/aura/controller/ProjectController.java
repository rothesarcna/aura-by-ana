package com.csit321g1.ana.aura.controller;

import com.csit321g1.ana.aura.dto.OverviewDtos.OverviewResponse;
import com.csit321g1.ana.aura.dto.ProjectDtos.MemberRequest;
import com.csit321g1.ana.aura.dto.ProjectDtos.MemberResponse;
import com.csit321g1.ana.aura.dto.ProjectDtos.ProjectRequest;
import com.csit321g1.ana.aura.dto.ProjectDtos.ProjectResponse;
import com.csit321g1.ana.aura.service.MemberService;
import com.csit321g1.ana.aura.service.OverviewService;
import com.csit321g1.ana.aura.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final MemberService memberService;
    private final OverviewService overviewService;

    public ProjectController(ProjectService projectService, MemberService memberService, OverviewService overviewService) {
        this.projectService = projectService;
        this.memberService = memberService;
        this.overviewService = overviewService;
    }

    // POST /api/projects - Create a new project (the caller becomes owner and first member)
    @PostMapping
    public ResponseEntity<ProjectResponse> create(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @Valid @RequestBody ProjectRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.create(userId, body));
    }

    // GET /api/projects - Projects the caller belongs to
    @GetMapping
    public ResponseEntity<List<ProjectResponse>> list(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId) {
        return ResponseEntity.ok(projectService.list(userId));
    }

    // GET /api/projects/{id}
    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> get(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId) {
        return ResponseEntity.ok(projectService.get(userId, projectId));
    }

    // PUT /api/projects/{id}
    @PutMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> update(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @Valid @RequestBody ProjectRequest body) {
        return ResponseEntity.ok(projectService.update(userId, projectId, body));
    }

    // DELETE /api/projects/{id} - archives the project (owner only); nothing is physically deleted
    @DeleteMapping("/{projectId}")
    public ResponseEntity<Map<String, String>> delete(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId) {
        projectService.delete(userId, projectId);
        return ResponseEntity.ok(Map.of("message", "Project deleted successfully"));
    }

    // GET /api/projects/{id}/overview?days=14
    @GetMapping("/{projectId}/overview")
    public ResponseEntity<OverviewResponse> overview(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @RequestParam(name = "days", required = false) Integer days) {
        return ResponseEntity.ok(overviewService.get(userId, projectId, days));
    }

    // ---- group members ----

    @GetMapping("/{projectId}/members")
    public ResponseEntity<List<MemberResponse>> members(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId) {
        return ResponseEntity.ok(memberService.list(userId, projectId));
    }

    @PostMapping("/{projectId}/members")
    public ResponseEntity<MemberResponse> addMember(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @Valid @RequestBody MemberRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(memberService.add(userId, projectId, body));
    }

    @PutMapping("/{projectId}/members/{memberId}")
    public ResponseEntity<MemberResponse> updateMember(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @PathVariable("memberId") Long memberId,
            @Valid @RequestBody MemberRequest body) {
        return ResponseEntity.ok(memberService.update(userId, projectId, memberId, body));
    }

    @DeleteMapping("/{projectId}/members/{memberId}")
    public ResponseEntity<Map<String, String>> removeMember(
            @RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
            @PathVariable("projectId") Long projectId,
            @PathVariable("memberId") Long memberId) {
        memberService.remove(userId, projectId, memberId);
        return ResponseEntity.ok(Map.of("message", "Member removed"));
    }
}
