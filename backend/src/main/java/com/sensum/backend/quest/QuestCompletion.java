package com.sensum.backend.quest;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name="quest_completions")
public class QuestCompletion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Long questId;
    private String mood;

    @Column(name="moment_text")
    private String momentText;

    @Column(name="completed_at")
    private Instant completedAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getQuestId() { return questId; }
    public void setQuestId(Long questId) { this.questId = questId; }

    public String getMood() { return mood; }
    public void setMood(String mood) { this.mood = mood; }

    public String getMomentText() { return momentText; }
    public void setMomentText(String momentText) { this.momentText = momentText; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}
