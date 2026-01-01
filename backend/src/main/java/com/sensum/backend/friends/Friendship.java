package com.sensum.backend.friends;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
    name = "friendships",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "friend_id"})
)
/**
 * Directional friendship edge.
 *
 * <p>Friendships are modeled as two rows (A -> B and B -> A) to allow symmetrical operations
 * and efficient queries per-user.
 *
 * <p>Status is a small string enum (current values in code: accepted, blocked).
 */
public class Friendship {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "friend_id", nullable = false)
    private Long friendId;

    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getFriendId() { return friendId; }
    public void setFriendId(Long friendId) { this.friendId = friendId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}