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
    /**
     * Primary key, equal to the user id.
     */
    public Long userId;

    @Column(name = "selected_paths", nullable = false)
    /**
     * JSON array string of selected "paths" (e.g. ["calm","fitness"]).
     */
    public String selectedPaths = "[]";

    @Column(name = "nudge_threshold_sec", nullable = false)
    /**
     * Threshold in seconds after which the extension should show a nudge.
     */
    public int nudgeThresholdSec = 480;

    @Column(name = "share_level", nullable = false)
    /**
     * Whether friends can see XP/level.
     */
    public boolean shareLevel = false;

    @Column(name = "share_streak", nullable = false)
    /**
     * Whether friends can see streak.
     */
    public boolean shareStreak = false;

    @Column(name = "share_categories", nullable = false)
    /**
     * Whether friends can see quest categories.
     */
    public boolean shareCategories = false;

    @Column(name = "share_moments", nullable = false)
    /**
     * Whether friends can see the user's moment text.
     */
    public boolean shareMoments = false;

    @Column(name = "tracked_domains", nullable = false)
    /**
     * JSON array string of domains to track (e.g. ["youtube.com","reddit.com"]).
     */
    public String trackedDomains = "[]";
}