package com.csit321g1.ana.aura.repository;

import com.csit321g1.ana.aura.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    // Assuming your Notification entity named the user field 'recipient' or 'user'
    List<Notification> findByRecipient_IdOrderByCreatedAtDesc(Long userId);
}