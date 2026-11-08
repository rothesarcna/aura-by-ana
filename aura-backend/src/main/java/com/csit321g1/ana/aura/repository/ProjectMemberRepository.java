package com.csit321g1.ana.aura.repository;

import com.csit321g1.ana.aura.model.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {

    /** All members of a project, including removed ones (needed to resolve names on old records). */
    List<ProjectMember> findByProjectIdOrderByIdAsc(Long projectId);

    Optional<ProjectMember> findByIdAndProjectId(Long id, Long projectId);

    Optional<ProjectMember> findByProjectIdAndUserIdAndActiveTrue(Long projectId, Long userId);

    boolean existsByProjectIdAndUserIdAndActiveTrue(Long projectId, Long userId);

    /** The projects a user belongs to (and has not been removed from). */
    List<ProjectMember> findByUserIdAndActiveTrueAndProjectArchivedFalse(Long userId);
}
