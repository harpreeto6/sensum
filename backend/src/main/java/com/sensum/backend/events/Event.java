package com.sensum.backend.events;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "events")
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "user_id")
    public Long userId; // nullable for now

    @Column(nullable = false)
    public String domain;

    @Column(name = "duration_sec", nullable = false)
    public int durationSec;

    @Column(name = "event_type", nullable = false)
    public String eventType;

    @Column(nullable = false)
    public Instant ts;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt = Instant.now();
}