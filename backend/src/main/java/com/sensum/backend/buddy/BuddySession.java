package com.sensum.backend.buddy;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "buddy_sessions")
/**
 * A two-person accountability session.
 *
 * <p>Sessions are created as "pending" until a participant joins, then become "active", and
 * finally "completed".
 */
public class BuddySession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_a_id")
    private Long userAId;

    @Column(name = "user_b_id")
    private Long userBId;

    private String mode;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    private String status; // pending, active, completed

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "created_at")
    private Instant createdAt;

    public BuddySession() {}

    public BuddySession(Long userAId, Long userBId, String mode, Integer durationMinutes) {
        this.userAId = userAId;
        this.userBId = userBId;
        this.mode = mode;
        this.durationMinutes = durationMinutes;
        this.status = "pending";
        this.createdAt = Instant.now();
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserAId() { return userAId; }
    public void setUserAId(Long userAId) { this.userAId = userAId; }

    public Long getUserBId() { return userBId; }
    public void setUserBId(Long userBId) { this.userBId = userBId; }

    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getEndedAt() { return endedAt; }
    public void setEndedAt(Instant endedAt) { this.endedAt = endedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}