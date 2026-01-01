package com.sensum.backend.buddy;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

/**
 * Repository for querying {@link BuddyCheckin} rows.
 */
public interface BuddyCheckinRepository extends JpaRepository<BuddyCheckin, Long> {
    
    /**
     * Returns all check-ins for a session (most recent first).
     */
    @Query("SELECT b FROM BuddyCheckin b WHERE b.sessionId = :sessionId ORDER BY b.createdAt DESC")
    List<BuddyCheckin> findBySessionId(@Param("sessionId") Long sessionId);

    /**
     * Returns check-ins for a specific user within a session (most recent first).
     */
    @Query("SELECT b FROM BuddyCheckin b WHERE b.sessionId = :sessionId AND b.userId = :userId ORDER BY b.createdAt DESC")
    List<BuddyCheckin> findBySessionIdAndUserId(@Param("sessionId") Long sessionId, @Param("userId") Long userId);
}