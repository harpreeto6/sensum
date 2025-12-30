package com.sensum.backend.achievement;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/achievements")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AchievementController {

    @Autowired
    private AchievementService achievementService;

    // GET /achievements/user?userId=1 - Get all user's earned badges
    @GetMapping("/user")
    public ResponseEntity<?> getUserAchievements(@RequestParam Long userId) {
        List<Map<String, Object>> achievements = achievementService.getUserAchievements(userId);
        return ResponseEntity.ok(Map.of(
                "count", achievements.size(),
                "achievements", achievements
        ));
    }

    // GET /achievements/all?userId=1 - Get all badges (shows which are locked)
    @GetMapping("/all")
    public ResponseEntity<?> getAllAchievements(@RequestParam Long userId) {
        List<Map<String, Object>> achievements = achievementService.getAllAchievements(userId);
        return ResponseEntity.ok(achievements);
    }
}