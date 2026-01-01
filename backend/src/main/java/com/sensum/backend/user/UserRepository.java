package com.sensum.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/**
 * Persistence access for {@link User} entities.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Looks up a user by email.
     */
    Optional<User> findByEmail(String email);
}