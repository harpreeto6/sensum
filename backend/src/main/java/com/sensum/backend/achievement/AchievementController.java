package com.sensum.backend.achievement;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/achievements")
//@CrossOrigin(origins = "*", allowedHeaders = "*")
/**
 * Read-only endpoints for achievements (badges).
 *
 * <p>Achievements are defined globally (see {@link Achievement}) and are unlocked per-user
 * (see {@link UserAchievement}).
 *
 * <h2>Authentication</h2>
 * These endpoints verify that the requested {@code userId} matches the authenticated user id set
 * by {@link com.sensum.backend.security.JwtAuthenticationFilter}.
 */
public class AchievementController {

    @Autowired
    private AchievementService achievementService;

    // GET /achievements/user?userId=1 - Get all user's earned badges
    @GetMapping("/user")
    /**
     * Returns achievements unlocked by the authenticated user.
     */
    public ResponseEntity<?> getUserAchievements(@RequestParam Long userId, HttpServletRequest request) {
        Long authedUserId = (Long) request.getAttribute("userId");
        if (authedUserId == null) {
            return ResponseEntity.status(401).build();
        }
        if (!authedUserId.equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        List<Map<String, Object>> achievements = achievementService.getUserAchievements(userId);
        return ResponseEntity.ok(Map.of(
                "count", achievements.size(),
                "achievements", achievements
        ));
    }

    // GET /achievements/all?userId=1 - Get all badges (shows which are locked)
    @GetMapping("/all")
    /**
     * Returns all achievements and whether the authenticated user has unlocked each one.
     */
    public ResponseEntity<?> getAllAchievements(@RequestParam Long userId, HttpServletRequest request) {
        Long authedUserId = (Long) request.getAttribute("userId");
        if (authedUserId == null) {
            return ResponseEntity.status(401).build();
        }
        if (!authedUserId.equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        List<Map<String, Object>> achievements = achievementService.getAllAchievements(userId);
        return ResponseEntity.ok(achievements);
    }
}