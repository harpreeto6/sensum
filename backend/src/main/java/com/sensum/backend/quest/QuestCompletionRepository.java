package com.sensum.backend.quest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuestCompletionRepository extends JpaRepository<QuestCompletion, Long> {
    List<QuestCompletion> findTop1ByUserIdOrderByCompletedAtDesc(Long userId);
    List<QuestCompletion> findTop10ByUserIdOrderByCompletedAtDesc(Long userId);

    @Query("SELECT COUNT(qc) FROM QuestCompletion qc WHERE qc.userId = :userId")
    long countByUserId(@Param("userId") Long userId);

    
}
