package com.sensum.backend.achievement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

/**
 * Repository for {@link UserAchievement} rows.
 */
public interface UserAchievementRepository extends JpaRepository<UserAchievement, Long> {
    
    /**
     * Returns a user's achievements ordered by unlock time (most recent first).
     */
    @Query("SELECT ua FROM UserAchievement ua WHERE ua.userId = :userId ORDER BY ua.unlockedAt DESC")
    List<UserAchievement> findByUserId(@Param("userId") Long userId);
    
    /**
     * Looks up whether the user has already unlocked an achievement.
     */
    @Query("SELECT ua FROM UserAchievement ua WHERE ua.userId = :userId AND ua.achievementId = :achievementId")
    Optional<UserAchievement> findByUserIdAndAchievementId(@Param("userId") Long userId, @Param("achievementId") Long achievementId);
    
    /**
     * Counts unlocked achievements for a user.
     */
    @Query("SELECT COUNT(ua) FROM UserAchievement ua WHERE ua.userId = :userId")
    int countByUserId(@Param("userId") Long userId);
}