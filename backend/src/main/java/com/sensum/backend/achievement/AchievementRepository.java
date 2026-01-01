package com.sensum.backend.achievement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

/**
 * Repository for reading {@link Achievement} definitions.
 */
public interface AchievementRepository extends JpaRepository<Achievement, Long> {
    
    /**
     * Finds an achievement by unique name.
     */
    Optional<Achievement> findByName(String name);
    
    /**
     * Returns all achievements ordered by creation time.
     */
    @Query("SELECT a FROM Achievement a ORDER BY a.createdAt ASC")
    List<Achievement> findAll();
}