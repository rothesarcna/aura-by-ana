package com.csit321g1.ana.aura.controller;

import com.csit321g1.ana.aura.model.Notification;
import com.csit321g1.ana.aura.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users/{userId}/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getUserNotifications(userId));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long userId, @PathVariable Long notificationId) {
        try {
            return ResponseEntity.ok(notificationService.markAsRead(notificationId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}