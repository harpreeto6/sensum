package com.sensum.backend.buddy;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface BuddyCheckinRepository extends JpaRepository<BuddyCheckin, Long> {
    
    @Query("SELECT b FROM BuddyCheckin b WHERE b.sessionId = :sessionId ORDER BY b.createdAt DESC")
    List<BuddyCheckin> findBySessionId(@Param("sessionId") Long sessionId);

    @Query("SELECT b FROM BuddyCheckin b WHERE b.sessionId = :sessionId AND b.userId = :userId ORDER BY b.createdAt DESC")
    List<BuddyCheckin> findBySessionIdAndUserId(@Param("sessionId") Long sessionId, @Param("userId") Long userId);
}