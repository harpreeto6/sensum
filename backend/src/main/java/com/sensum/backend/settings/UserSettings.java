package com.sensum.backend.settings;

import jakarta.persistence.*;

@Entity
@Table(name = "user_settings")
/**
 * Per-user configurable settings.
 *
 * <p>Currently stored as a single row per user.
 * Some fields (like {@link #selectedPaths} and {@link #trackedDomains}) are stored as JSON strings
 * for simplicity.
 */
public class UserSettings {

    @Id
    @Column(name = "user_id")
    public Long userId;

    @Column(name = "selected_paths", nullable = false)
    public String selectedPaths = "[]";

    @Column(name = "nudge_threshold_sec", nullable = false)
    public int nudgeThresholdSec = 480;

    @Column(name = "share_level", nullable = false)
    public boolean shareLevel = false;

    @Column(name = "share_streak", nullable = false)
    public boolean shareStreak = false;

    @Column(name = "share_categories", nullable = false)
    public boolean shareCategories = false;

    @Column(name = "share_moments", nullable = false)
    public boolean shareMoments = false;

    @Column(name = "tracked_domains", nullable = false)
    public String trackedDomains = "[]";
}