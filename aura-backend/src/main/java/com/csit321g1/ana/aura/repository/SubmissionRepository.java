package com.csit321g1.ana.aura.repository;

import com.csit321g1.ana.aura.model.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByComponent_Id(Long componentId);
}