package com.csit321g1.ana.aura.repository;

import com.csit321g1.ana.aura.model.FeedbackReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackReplyRepository extends JpaRepository<FeedbackReply, Long> {

    List<FeedbackReply> findByFeedbackIdOrderByCreatedAtAscIdAsc(Long feedbackId);

    /** Every reply in a project, oldest first (one query instead of one per feedback record). */
    List<FeedbackReply> findByFeedbackProjectIdOrderByCreatedAtAscIdAsc(Long projectId);
}
