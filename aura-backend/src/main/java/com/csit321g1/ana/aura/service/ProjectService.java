package com.csit321g1.ana.aura.service;

import com.csit321g1.ana.aura.model.Project;
import com.csit321g1.ana.aura.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    // CREATE
    public Project createProject(Project project) {
        return projectRepository.save(project);
    }

    // READ (All)
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    // READ (Single)
    public Project getProjectById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));
    }

    // UPDATE
    public Project updateProject(Long id, Project updatedData) {
        Project existingProject = getProjectById(id);
        
        existingProject.setTitle(updatedData.getTitle());
        existingProject.setType(updatedData.getType());
        existingProject.setAdviser(updatedData.getAdviser());
        existingProject.setStartDate(updatedData.getStartDate());
        existingProject.setDescription(updatedData.getDescription());
        
        return projectRepository.save(existingProject);
    }

    // DELETE
    public void deleteProject(Long id) {
        Project existingProject = getProjectById(id);
        projectRepository.delete(existingProject);
    }
}