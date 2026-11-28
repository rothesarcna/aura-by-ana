package com.csit321g1.ana.aura.repository;

import com.csit321g1.ana.aura.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUser_IdOrderByCreatedAtDesc(Long userId);

    @Query("select count(n) > 0 from Notification n where n.user.id = :userId "
            + "and n.notification_type = :type and n.message = :message and n.createdAt >= :since")
    boolean existsRecent(@Param("userId") Long userId, @Param("type") String type,
                         @Param("message") String message, @Param("since") Instant since);
}