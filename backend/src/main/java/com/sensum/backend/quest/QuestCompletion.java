package com.sensum.backend.quest;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name="quest_completions")
public class QuestCompletion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    public Long userId;
    public Long questId;
    public String mood;

    @Column(name="moment_text")
    public String momentText;

    @Column(name="completed_at")
    public Instant completedAt = Instant.now();
}
