package com.sensum.backend.achievement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface UserAchievementRepository extends JpaRepository<UserAchievement, Long> {
    
    @Query("SELECT ua FROM UserAchievement ua WHERE ua.userId = :userId ORDER BY ua.unlockedAt DESC")
    List<UserAchievement> findByUserId(@Param("userId") Long userId);
    
    @Query("SELECT ua FROM UserAchievement ua WHERE ua.userId = :userId AND ua.achievementId = :achievementId")
    Optional<UserAchievement> findByUserIdAndAchievementId(@Param("userId") Long userId, @Param("achievementId") Long achievementId);
    
    @Query("SELECT COUNT(ua) FROM UserAchievement ua WHERE ua.userId = :userId")
    int countByUserId(@Param("userId") Long userId);
}