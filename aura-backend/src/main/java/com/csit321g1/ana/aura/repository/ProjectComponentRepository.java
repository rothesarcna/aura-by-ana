package com.csit321g1.ana.aura.repository;

import com.csit321g1.ana.aura.model.ProjectComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectComponentRepository extends JpaRepository<ProjectComponent, Long> {

    /** Includes archived components so old history and feedback can still show their names. */
    List<ProjectComponent> findByProjectId(Long projectId);

    Optional<ProjectComponent> findByIdAndProjectIdAndArchivedFalse(Long id, Long projectId);
}
