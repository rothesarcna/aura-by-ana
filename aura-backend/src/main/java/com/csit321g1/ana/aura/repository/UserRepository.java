package com.csit321g1.ana.aura.repository;

import com.csit321g1.ana.aura.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    boolean existsByEmailIgnoreCase(String email);
    
    boolean existsByStudentIdIgnoreCase(String studentId);

    // Used to link a project member to a registered account by email
    Optional<User> findByEmailIgnoreCase(String email);
    
    // Used for loginStudent where identifier can be email OR studentId
    Optional<User> findByEmailIgnoreCaseOrStudentIdIgnoreCase(String email, String studentId);
}
