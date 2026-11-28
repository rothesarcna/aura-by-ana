package com.csit321g1.ana.aura.service;

import com.csit321g1.ana.aura.model.User;
import com.csit321g1.ana.aura.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /** Anyone who registers with this code becomes an adviser. Leave it empty to disable adviser sign-up. */
    @Value("${aura.adviser-code:}")
    private String adviserSecret;

    public User registerStudent(User user, String adviserCode) {
        if (userRepository.existsByEmailIgnoreCase(user.getEmail())) {
            throw new RuntimeException("An account with this email already exists.");
        }
        if (userRepository.existsByStudentIdIgnoreCase(user.getStudentId())) {
            throw new RuntimeException("This Student ID is already registered.");
        }

        user.setId(null); // never let a client choose the id (it would overwrite another user)
        boolean adviser = !adviserSecret.isBlank() && adviserSecret.equals(adviserCode);
        user.setRole(adviser ? "adviser" : "student");
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public User loginStudent(String identifier, String password) {
        String id = identifier.trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCaseOrStudentIdIgnoreCase(id, id)
                .orElseThrow(() -> new RuntimeException("Invalid email/Student ID or password."));
        if (!passwordMatches(user, password)) {
            throw new RuntimeException("Invalid email/Student ID or password.");
        }
        return user;
    }

    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));
        if (!passwordMatches(user, currentPassword)) {
            throw new RuntimeException("Current password is incorrect.");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public User getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));
        user.setPassword(null);
        return user;
    }

    /** Accepts BCrypt hashes, and upgrades old plaintext rows to BCrypt the first time they log in. */
    private boolean passwordMatches(User u, String raw) {
        String stored = u.getPassword();
        if (stored == null || raw == null) return false;
        if (stored.startsWith("$2")) return passwordEncoder.matches(raw, stored);
        if (!stored.equals(raw)) return false; // legacy plaintext row
        u.setPassword(passwordEncoder.encode(raw));
        userRepository.save(u);
        return true;
    }
}