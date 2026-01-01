package com.sensum.backend.achievement;

import jakarta.persistence.*;
//import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
//import tools.jackson.databind.JsonNode;;

@Entity
@Table(name = "achievements")
/**
 * Definition of an achievement (badge) that can be earned.
 *
 * <p>The {@link #trigger} field stores a small JSON expression describing what is required to
 * unlock it (for example: quest_count >= N).
 */
public class Achievement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private String icon;

    @Column(columnDefinition = "jsonb")
    private String trigger;

    @Column(name = "created_at")
    private Instant createdAt;

    public Achievement() {}

    public Achievement(String name, String description, String icon, String trigger) {
        this.name = name;
        this.description = description;
        this.icon = icon;
        this.trigger = trigger;  
        this.createdAt = Instant.now();
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getTrigger() { return trigger; }
    public void setTrigger(String trigger) { this.trigger = trigger; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}