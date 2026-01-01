package com.sensum.backend.user;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.Instant;

@Entity
@Table(name = "users")
/**
 * Core user account record.
 *
 * <p>This entity represents an authenticated person in the system.
 * It contains identity fields (email + password hash) and lightweight progression fields used
 * for gamification (XP/level/streak).
 *
 * <p><b>Security:</b> {@link #passwordHash} stores a one-way password hash produced by
 * {@link org.springframework.security.crypto.password.PasswordEncoder}.
 */
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
