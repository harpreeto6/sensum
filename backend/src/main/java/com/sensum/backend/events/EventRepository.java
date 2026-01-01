package com.sensum.backend.events;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * CRUD repository for {@link Event} entities.
 */
public interface EventRepository extends JpaRepository<Event, Long> {}