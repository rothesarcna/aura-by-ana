package com.csit321g1.ana.aura.repository;

import com.csit321g1.ana.aura.model.HistoryEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoryEntryRepository extends JpaRepository<HistoryEntry, Long> {

    /** Newest first. */
    List<HistoryEntry> findByProjectIdOrderByCreatedAtDescIdDesc(Long projectId);
}
