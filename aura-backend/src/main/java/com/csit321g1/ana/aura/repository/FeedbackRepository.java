package com.csit321g1.ana.aura.repository;

import com.csit321g1.ana.aura.model.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    List<Feedback> findByProjectId(Long projectId);

    Optional<Feedback> findByIdAndProjectId(Long id, Long projectId);

    /** The newer version that replaced this feedback, if any. */
    Optional<Feedback> findFirstByPreviousFeedbackId(Long previousFeedbackId);
}
