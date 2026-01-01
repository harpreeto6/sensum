package com.sensum.backend.quest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Spring Data repository for {@link QuestOutcome}.
 *
 * <p>This repository is used for personalization: it aggregates the user's historical interactions and
 * returns per-quest counts that the recommendation endpoint can turn into scores.</p>
 */
public interface QuestOutcomeRepository extends JpaRepository<QuestOutcome, Long> {
    
    /**
     * Counts how many times a user produced a specific outcome for a specific quest.
     *
     * @param userId user id
     * @param questId quest id
     * @param outcome outcome value (completed/skipped/snoozed)
     * @return number of matching rows
     */
    long countByUserIdAndQuestIdAndOutcome(Long userId, Long questId, String outcome);
    
    /**
     * Loads all outcomes for a user.
     *
     * <p>This is useful if you want to compute personalization in memory, but for the MVP we prefer the
     * aggregation query {@link #getQuestScoresForUser(Long)} to reduce data transfer.</p>
     */
    List<QuestOutcome> findByUserId(Long userId);
    
    /**
     * Aggregates outcomes per quest for the given user.
     *
     * <p>Returns one row per quest id containing counts for:
     * <ul>
     *   <li>completed</li>
     *   <li>skipped</li>
     * </ul>
     * "snoozed" is intentionally not included in this projection yet.</p>
     *
     * @param userId user id
     * @return aggregated results for scoring (one entry per quest)
     */
    @Query("""
        SELECT q.questId as questId, 
               SUM(CASE WHEN q.outcome = 'completed' THEN 1 ELSE 0 END) as completed,
               SUM(CASE WHEN q.outcome = 'skipped' THEN 1 ELSE 0 END) as skipped
        FROM QuestOutcome q
        WHERE q.userId = :userId
        GROUP BY q.questId
    """)
    List<QuestScoreProjection> getQuestScoresForUser(@Param("userId") Long userId);
    
    /**
     * Projection interface for {@link #getQuestScoresForUser(Long)}.
     *
     * <p>Spring Data will auto-implement this interface based on the selected column aliases.</p>
     */
    interface QuestScoreProjection {
        Long getQuestId();
        Long getCompleted();
        Long getSkipped();
    }
}