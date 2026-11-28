package com.csit321g1.ana.aura.repository;

import com.csit321g1.ana.aura.model.AiSuggestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AiSuggestionRepository extends JpaRepository<AiSuggestion, Long> {
}