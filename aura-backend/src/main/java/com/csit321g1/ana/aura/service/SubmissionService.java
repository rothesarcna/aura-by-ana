package com.csit321g1.ana.aura.service;

import com.csit321g1.ana.aura.model.ProjectComponent;
import com.csit321g1.ana.aura.model.Submission;
import com.csit321g1.ana.aura.model.User;
import com.csit321g1.ana.aura.repository.ProjectComponentRepository;
import com.csit321g1.ana.aura.repository.SubmissionRepository;
import com.csit321g1.ana.aura.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class SubmissionService {

    @Autowired
    private SubmissionRepository submissionRepository;
    
    @Autowired
    private ProjectComponentRepository componentRepository;
    
    @Autowired
    private UserRepository userRepository;

    public Submission addSubmission(Long componentId, Long userId, Submission submission) {
        ProjectComponent component = componentRepository.findById(componentId)
                .orElseThrow(() -> new RuntimeException("Component not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        submission.setComponent(component);
        submission.setSubmitted_by(user);
        
        // Auto-increment version number
        List<Submission> existing = submissionRepository.findByComponent_Id(componentId);
        submission.setVersion_number(existing.size() + 1);
        
        return submissionRepository.save(submission);
    }

    public List<Submission> getSubmissionsForComponent(Long componentId) {
        return submissionRepository.findByComponent_Id(componentId);
    }
}