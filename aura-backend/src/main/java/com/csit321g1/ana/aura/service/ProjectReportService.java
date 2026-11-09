package com.csit321g1.ana.aura.service;

import com.csit321g1.ana.aura.model.Project;
import com.csit321g1.ana.aura.model.ProjectMember;
import com.csit321g1.ana.aura.model.ProjectReport;
import com.csit321g1.ana.aura.repository.ProjectMemberRepository;
import com.csit321g1.ana.aura.repository.ProjectReportRepository;
import com.csit321g1.ana.aura.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProjectReportService {

    @Autowired
    private ProjectReportRepository reportRepository;
    
    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private ProjectMemberRepository memberRepository;

    public ProjectReport generateReport(Long projectId, Long generatedById, String reportType, String reportData) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
                
        ProjectMember generator = memberRepository.findById(generatedById)
                .orElseThrow(() -> new RuntimeException("Project member not found"));
                
        ProjectReport report = new ProjectReport();
        report.setProject(project);
        report.setGeneratedBy(generator); 
        report.setReportType(reportType);
        report.setReportData(reportData);
        
        return reportRepository.save(report);
    }

    public List<ProjectReport> getReportsForProject(Long projectId) {
        return reportRepository.findByProjectIdOrderByGeneratedAtDesc(projectId);
    }
}