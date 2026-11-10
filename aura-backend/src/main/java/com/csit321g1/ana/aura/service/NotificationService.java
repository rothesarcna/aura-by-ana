package com.csit321g1.ana.aura.service;

import com.csit321g1.ana.aura.model.Notification;
import com.csit321g1.ana.aura.model.User;
import com.csit321g1.ana.aura.repository.NotificationRepository;
import com.csit321g1.ana.aura.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private UserRepository userRepository;

    public Notification createNotification(Long userId, String type, String message) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setNotification_type(type);
        notification.setMessage(message);
        
        return notificationRepository.save(notification);
    }

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUser_IdOrderByCreatedAtDesc(userId);
    }

    public Notification markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        // Aligns with the ERD's read_at Instant field
        if (notification.getRead_at() == null) {
            notification.setRead_at(Instant.now());
            // If you still have the isRead boolean in the entity:
            notification.setRead(true);
        }
        
        return notificationRepository.save(notification);
    }
}