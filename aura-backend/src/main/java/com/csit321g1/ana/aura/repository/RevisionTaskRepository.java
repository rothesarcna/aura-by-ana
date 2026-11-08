package com.csit321g1.ana.aura.repository;

import com.csit321g1.ana.aura.model.RevisionTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RevisionTaskRepository extends JpaRepository<RevisionTask, Long> {

    List<RevisionTask> findByProjectIdAndArchivedFalse(Long projectId);

    Optional<RevisionTask> findByIdAndProjectIdAndArchivedFalse(Long id, Long projectId);
}
