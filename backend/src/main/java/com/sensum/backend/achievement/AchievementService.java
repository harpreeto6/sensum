package com.sensum.backend.achievement;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class AchievementService {

    @Autowired
    private AchievementRepository achievementRepository;

    @Autowired
    private UserAchievementRepository userAchievementRepository;

    /**
     * Check and unlock achievements for a user
     * Returns list of newly unlocked achievements
     */
    public List<Achievement> unlockAchievementsForUser(Long userId, Map<String, Integer> userStats) {
        List<Achievement> newAchievements = new ArrayList<>();
        List<Achievement> allAchievements = achievementRepository.findAll();

        for (Achievement achievement : allAchievements) {
            // Check if user already has this achievement
            Optional<UserAchievement> existing = userAchievementRepository.findByUserIdAndAchievementId(userId, achievement.getId());
            if (existing.isPresent()) {
                continue; // Already unlocked
            }

            // Check if user meets the trigger condition
            if (meetsTrigger(achievement.getTrigger(), userStats)) {
                // Create the user achievement record
                UserAchievement ua = new UserAchievement(userId, achievement.getId());
                userAchievementRepository.save(ua);
                newAchievements.add(achievement);
            }
        }

        return newAchievements;
    }

    /**
     * Check if user's stats meet the achievement trigger
     */
    private boolean meetsTrigger(String triggerJson, Map<String, Integer> userStats) {
        try {
            // Simple string parsing instead of JsonNode
            // Extract type and value from JSON string
            // Format: {"type": "quest_count", "value": 1}
            
            String type = extractJsonValue(triggerJson, "type");
            int requiredValue = Integer.parseInt(extractJsonValue(triggerJson, "value"));

            switch (type) {
                case "quest_count":
                    return userStats.getOrDefault("questCount", 0) >= requiredValue;
                case "streak":
                    return userStats.getOrDefault("streak", 0) >= requiredValue;
                case "level":
                    return userStats.getOrDefault("level", 0) >= requiredValue;
                case "friend_count":
                    return userStats.getOrDefault("friendCount", 0) >= requiredValue;
                default:
                    return false;
            }
        } catch (Exception e) {
            return false;
        }
    }

    private String extractJsonValue(String json, String key) {
        String searchStr = "\"" + key + "\":";
        int start = json.indexOf(searchStr);
        if (start == -1) return "";
        
        start = json.indexOf(":", start) + 1;
        int end = json.indexOf(",", start);
        if (end == -1) end = json.indexOf("}", start);
        
        String value = json.substring(start, end).trim();
        return value.replaceAll("[\"\\s]", "");
    }

    /**
     * Get all achievements a user has unlocked
     */
    public List<Map<String, Object>> getUserAchievements(Long userId) {
        List<UserAchievement> userAchievements = userAchievementRepository.findByUserId(userId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (UserAchievement ua : userAchievements) {
            Optional<Achievement> achievement = achievementRepository.findById(ua.getAchievementId());
            if (achievement.isPresent()) {
                Achievement a = achievement.get();
                Map<String, Object> map = new HashMap<>();
                map.put("id", a.getId());
                map.put("name", a.getName());
                map.put("description", a.getDescription());
                map.put("icon", a.getIcon());
                map.put("unlockedAt", ua.getUnlockedAt());
                result.add(map);
            }
        }

        return result;
    }

    /**
     * Get all achievements (for checking which ones are locked)
     */
    public List<Map<String, Object>> getAllAchievements(Long userId) {
        List<Achievement> all = achievementRepository.findAll();
        List<UserAchievement> userAchievements = userAchievementRepository.findByUserId(userId);
        Set<Long> unlockedIds = new HashSet<>();

        for (UserAchievement ua : userAchievements) {
            unlockedIds.add(ua.getAchievementId());
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Achievement a : all) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", a.getId());
            map.put("name", a.getName());
            map.put("description", a.getDescription());
            map.put("icon", a.getIcon());
            map.put("unlocked", unlockedIds.contains(a.getId()));
            result.add(map);
        }

        return result;
    }
}