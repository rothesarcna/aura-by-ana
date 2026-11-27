
package com.csit321g1.ana.aura.service;

import com.csit321g1.ana.aura.model.User;
import com.csit321g1.ana.aura.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User registerStudent(User user) {
        if (userRepository.existsByEmailIgnoreCase(user.getEmail())) {
            throw new RuntimeException("An account with this email already exists.");
        }

        if (userRepository.existsByStudentIdIgnoreCase(user.getStudentId())) {
            throw new RuntimeException("This Student ID is already registered.");
        }

        user.setRole("student");

        // Hash password before saving
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        return userRepository.save(user);
    }

    public User loginStudent(String identifier, String password) {
        String id = identifier.trim().toLowerCase();

        User user = userRepository.findByEmailIgnoreCaseOrStudentIdIgnoreCase(id, id)
                .orElseThrow(() -> new RuntimeException("Invalid email/Student ID or password."));

        // Compare entered password with stored hash
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid email/Student ID or password.");
        }

        return user;
    }

    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect.");
        }

        // Hash new password before saving
        user.setPassword(passwordEncoder.encode(newPassword));

        userRepository.save(user);
    }

    public User getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));

        user.setPassword(null);
        return user;
    }
}
