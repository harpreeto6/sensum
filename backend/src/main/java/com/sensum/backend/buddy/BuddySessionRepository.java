package com.sensum.backend.buddy;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

/**
 * Repository for querying {@link BuddySession} rows.
 */
public interface BuddySessionRepository extends JpaRepository<BuddySession, Long> {
    
    /**
     * Returns sessions for a user that are not yet completed.
     */
    @Query("SELECT b FROM BuddySession b WHERE (b.userAId = :userId OR b.userBId = :userId) AND b.status != 'completed'")
    List<BuddySession> findActiveByUserId(@Param("userId") Long userId);

    /**
     * Returns all sessions for a user ordered by creation time (most recent first).
     */
    @Query("SELECT b FROM BuddySession b WHERE (b.userAId = :userId OR b.userBId = :userId) ORDER BY b.createdAt DESC")
    List<BuddySession> findByUserId(@Param("userId") Long userId);
}