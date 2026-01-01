package com.sensum.backend.quest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Repository for {@link QuestCompletion} rows.
 */
public interface QuestCompletionRepository extends JpaRepository<QuestCompletion, Long> {

    /**
     * Returns the most recent completion for a user.
     */
    List<QuestCompletion> findTop1ByUserIdOrderByCompletedAtDesc(Long userId);

    /**
     * Returns recent completions for a user (used by friend feeds).
     */
    List<QuestCompletion> findTop10ByUserIdOrderByCompletedAtDesc(Long userId);

    /**
     * Counts total quest completions for a user.
     */
    @Query("SELECT COUNT(qc) FROM QuestCompletion qc WHERE qc.userId = :userId")
    long countByUserId(@Param("userId") Long userId);

    
}
