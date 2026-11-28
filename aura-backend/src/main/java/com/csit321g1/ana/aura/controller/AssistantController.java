package com.csit321g1.ana.aura.controller;

import com.csit321g1.ana.aura.service.AssistantService;
import com.csit321g1.ana.aura.service.AssistantService.SuggestionResponse;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/projects/{projectId}/assistant")
public class AssistantController {

    private final AssistantService service;

    public AssistantController(AssistantService service) {
        this.service = service;
    }

    @PostMapping("/{mode}")
    public SuggestionResponse ask(@RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
                                  @PathVariable Long projectId, @PathVariable String mode) {
        return service.ask(userId, projectId, mode);
    }

    @PatchMapping("/suggestions/{id}")
    public SuggestionResponse review(@RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
                                     @PathVariable Long projectId, @PathVariable Long id,
                                     @RequestBody Map<String, String> body) {
        return service.review(userId, projectId, id, body.get("status"), body.get("text"));
    }
}