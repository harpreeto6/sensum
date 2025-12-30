package com.sensum.backend.friends;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "invites")
public class Invite {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, unique = true)
    public String code;

    @Column(name = "inviter_id", nullable = false)
    public Long inviterId;

    @Column(name = "expires_at", nullable = false)
    public Instant expiresAt;

    @Column(name = "used_at")
    public Instant usedAt;

    @Column(nullable = false)
    public Instant createdAt = Instant.now();
}