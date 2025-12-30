package com.sensum.backend.achievement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface AchievementRepository extends JpaRepository<Achievement, Long> {
    
    Optional<Achievement> findByName(String name);
    
    @Query("SELECT a FROM Achievement a ORDER BY a.createdAt ASC")
    List<Achievement> findAll();
}