package com.sensum.backend.quest;

import jakarta.persistence.*;

@Entity
@Table(name="quests")
public class Quest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    public String category;
    public String title;

    @Column(name="duration_sec")
    public int durationSec;

    public String prompt;
}
