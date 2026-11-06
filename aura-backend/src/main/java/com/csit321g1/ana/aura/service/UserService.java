package com.csit321g1.ana.aura.service;

import com.csit321g1.ana.aura.model.User;
import com.csit321g1.ana.aura.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User registerStudent(User user) {
        if (userRepository.existsByEmailIgnoreCase(user.getEmail())) {
            throw new RuntimeException("An account with this email already exists.");
        }
        if (userRepository.existsByStudentIdIgnoreCase(user.getStudentId())) {
            throw new RuntimeException("This Student ID is already registered.");
        }
        
        user.setRole("student");
        return userRepository.save(user);
    }

    public User loginStudent(String identifier, String password) {
        String id = identifier.trim().toLowerCase();
        
        User user = userRepository.findByEmailIgnoreCaseOrStudentIdIgnoreCase(id, id)
                .orElseThrow(() -> new RuntimeException("Invalid email/Student ID or password."));
                
        if (!user.getPassword().equals(password)) {
            throw new RuntimeException("Invalid email/Student ID or password.");
        }
        
        return user;
    }

    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));
                
        if (!user.getPassword().equals(currentPassword)) {
            throw new RuntimeException("Current password is incorrect.");
        }
        
        user.setPassword(newPassword);
        userRepository.save(user);
    }
}