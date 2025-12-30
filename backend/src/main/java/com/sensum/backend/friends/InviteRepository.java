package com.sensum.backend.friends;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface InviteRepository extends JpaRepository<Invite, Long> {
    Optional<Invite> findByCode(String code);
}