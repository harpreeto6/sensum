package com.sensum.backend.quest;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/**
 * Repository for {@link Quest} definitions.
 */
public interface QuestRepository extends JpaRepository<Quest, Long> {

    /**
     * Returns quests within a category.
     */
    List<Quest> findByCategory(String category);
}