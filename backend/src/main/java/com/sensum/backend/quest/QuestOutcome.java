package com.sensum.backend.quest;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * JPA entity representing how a user interacted with a quest.
 *
 * <h2>Why this exists</h2>
 * Quest completions alone are not enough for personalization. "Skipped" and "snoozed" actions provide
 * additional signal about what the user prefers or avoids.
 *
 * <h2>Storage</h2>
 * Backed by the {@code quest_outcomes} table (Flyway migration V10).
 *
 * <h2>Outcome values</h2>
 * This is stored as a string for simplicity in the MVP. Expected values are:
 * <ul>
 *   <li>{@code completed}</li>
 *   <li>{@code skipped}</li>
 *   <li>{@code snoozed}</li>
 * </ul>
 */
@Entity
@Table(name = "quest_outcomes")
public class QuestOutcome {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "quest_id", nullable = false)
    private Long questId;

    @Column(nullable = false)
    private String outcome;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    /** Default constructor required by JPA. */
    public QuestOutcome() {}

    /**
     * Convenience constructor.
     *
     * @param userId user performing the action
     * @param questId quest being acted on
     * @param outcome outcome value (see class-level docs)
     */
    public QuestOutcome(Long userId, Long questId, String outcome) {
        this.userId = userId;
        this.questId = questId;
        this.outcome = outcome;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getQuestId() {
        return questId;
    }

    public void setQuestId(Long questId) {
        this.questId = questId;
    }

    public String getOutcome() {
        return outcome;
    }

    public void setOutcome(String outcome) {
        this.outcome = outcome;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}