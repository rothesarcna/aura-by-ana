package com.csit321g1.ana.aura.controller;

import com.csit321g1.ana.aura.dto.NotificationDtos.NotificationResponse;
import com.csit321g1.ana.aura.service.AccessService;
import com.csit321g1.ana.aura.service.NotificationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;
    private final AccessService access;

    public NotificationController(NotificationService service, AccessService access) {
        this.service = service;
        this.access = access;
    }

    @GetMapping
    public List<NotificationResponse> list(@RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId) {
        access.requireUser(userId);
        return service.list(userId);
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse read(@RequestHeader(value = ApiHeaders.USER_ID, required = false) Long userId,
                                     @PathVariable Long id) {
        access.requireUser(userId);
        return service.markRead(userId, id);
    }
}