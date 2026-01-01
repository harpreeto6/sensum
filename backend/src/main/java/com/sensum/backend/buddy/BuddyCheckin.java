package com.sensum.backend.buddy;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "buddy_checkins")
/**
 * A single status update for a {@link BuddySession}.
 */
public class BuddyCheckin {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "session_id", nullable = false)
    private Long sessionId;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "status", nullable = false)
    private String status;
    
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    
    // Constructor
    public BuddyCheckin(Long sessionId, Long userId, String status) {
        this.sessionId = sessionId;
        this.userId = userId;
        this.status = status;
        this.createdAt = Instant.now();
    }
    
    // Default constructor (required by JPA)
    public BuddyCheckin() {}
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public Long getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public Instant getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}