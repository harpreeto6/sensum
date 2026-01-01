package com.sensum.backend.settings;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * CRUD repository for {@link UserSettings}.
 */
public interface UserSettingsRepository extends JpaRepository<UserSettings, Long> {}