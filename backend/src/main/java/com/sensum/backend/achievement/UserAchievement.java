package com.sensum.backend.achievement;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "user_achievements")
public class UserAchievement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "achievement_id")
    private Long achievementId;

    @Column(name = "unlocked_at")
    private Instant unlockedAt;

    public UserAchievement() {}

    public UserAchievement(Long userId, Long achievementId) {
        this.userId = userId;
        this.achievementId = achievementId;
        this.unlockedAt = Instant.now();
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getAchievementId() { return achievementId; }
    public void setAchievementId(Long achievementId) { this.achievementId = achievementId; }

    public Instant getUnlockedAt() { return unlockedAt; }
    public void setUnlockedAt(Instant unlockedAt) { this.unlockedAt = unlockedAt; }
}