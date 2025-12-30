package com.sensum.backend.friends;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
    name = "friendships",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "friend_id"})
)
public class Friendship {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "user_id", nullable = false)
    public Long userId;

    @Column(name = "friend_id", nullable = false)
    public Long friendId;

    private String status;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt = Instant.now();

    public String getStatus() { return status; }

    public void setStatus(String status) { this.status = status; }
}