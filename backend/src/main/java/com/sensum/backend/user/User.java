package com.sensum.backend.user;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.Instant;

@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, unique = true)
    public String email;

    @Column(name = "password_hash", nullable = false)
    public String passwordHash;

    public int xp;
    public int level;
    public int streak;

    public LocalDate lastCompletedDate;

    @Column(nullable = false)
    public Instant createdAt = Instant.now();

    public int getXp() {
        return xp;
    }
    public int getLevel() {
        return level;
    }
    public int getStreak() {
        return streak;
    }
    public String getEmail() {
        return email;
    }
    public Long getId() {
        return id;
    }
}
