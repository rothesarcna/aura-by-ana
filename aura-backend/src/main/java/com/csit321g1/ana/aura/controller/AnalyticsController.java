package com.csit321g1.ana.aura.controller;

import com.csit321g1.ana.aura.service.AnalyticsService;
import com.csit321g1.ana.aura.service.AnalyticsService.AnalyticsResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects/{projectId}/analytics")
public class AnalyticsController {

    private final AnalyticsService service;

    public AnalyticsController(AnalyticsService service) {
        this.service = service;
    }

    @GetMapping
    public AnalyticsResponse get(@RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
                                 @PathVariable Long projectId) {
        return service.get(userId, projectId);
    }
}