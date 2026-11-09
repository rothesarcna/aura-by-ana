package com.csit321g1.ana.aura.repository;

import com.csit321g1.ana.aura.model.ProjectReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectReportRepository extends JpaRepository<ProjectReport, Long> {
    List<ProjectReport> findByProjectIdOrderByGeneratedAtDesc(Long projectId);
}