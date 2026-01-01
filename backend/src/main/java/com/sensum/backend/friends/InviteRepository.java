package com.sensum.backend.friends;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/**
 * Persistence operations for {@link Invite} entities.
 */
public interface InviteRepository extends JpaRepository<Invite, Long> {

    /**
     * Looks up an invite by its human-entered code.
     */
    Optional<Invite> findByCode(String code);
}