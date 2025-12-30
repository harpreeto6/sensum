package com.sensum.backend.quest;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuestCompletionRepository extends JpaRepository<QuestCompletion, Long> {
    List<QuestCompletion> findTop1ByUserIdOrderByCompletedAtDesc(Long userId);
    List<QuestCompletion> findTop10ByUserIdOrderByCompletedAtDesc(Long userId);
}
