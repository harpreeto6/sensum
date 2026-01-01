package com.sensum.backend.settings;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/me/settings")
public class MeSettingsController {

    private final UserSettingsRepository settingsRepo;

    public MeSettingsController(UserSettingsRepository settingsRepo) {
        this.settingsRepo = settingsRepo;
    }

    public record SettingsResponse(
            String selectedPaths,
            int nudgeThresholdSec,
            String trackedDomains,
            boolean shareLevel,
            boolean shareStreak,
            boolean shareCategories,
            boolean shareMoments
    ) {}

    public static class UpdateSettingsRequest {
        public String selectedPaths;      // JSON string like ["calm","fitness"]
        public Integer nudgeThresholdSec; // allow partial update
        public String trackedDomains;     // JSON string like ["youtube.com","reddit.com"]
        public Boolean shareLevel;
        public Boolean shareStreak;
        public Boolean shareCategories;
        public Boolean shareMoments;
    }

    @GetMapping
    public ResponseEntity<?> getSettings(HttpServletRequest req) {
        Long userId = (Long) req.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        UserSettings s = settingsRepo.findById(userId).orElseGet(() -> {
            UserSettings created = new UserSettings();
            created.userId = userId;
            return settingsRepo.save(created);
        });

        return ResponseEntity.ok(new SettingsResponse(
                s.selectedPaths,
                s.nudgeThresholdSec,
                s.trackedDomains,
                s.shareLevel,
                s.shareStreak,
                s.shareCategories,
                s.shareMoments
        ));
    }

    @PutMapping
    public ResponseEntity<?> updateSettings(@RequestBody UpdateSettingsRequest body, HttpServletRequest req) {
        Long userId = (Long) req.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        UserSettings s = settingsRepo.findById(userId).orElseGet(() -> {
            UserSettings created = new UserSettings();
            created.userId = userId;
            return created;
        });

        if (body.selectedPaths != null) s.selectedPaths = body.selectedPaths;
        if (body.nudgeThresholdSec != null) s.nudgeThresholdSec = body.nudgeThresholdSec;
        if (body.trackedDomains != null) s.trackedDomains = body.trackedDomains;
        if (body.shareLevel != null) s.shareLevel = body.shareLevel;
        if (body.shareStreak != null) s.shareStreak = body.shareStreak;
        if (body.shareCategories != null) s.shareCategories = body.shareCategories;
        if (body.shareMoments != null) s.shareMoments = body.shareMoments;

        settingsRepo.save(s);

        return ResponseEntity.ok(new SettingsResponse(
                s.selectedPaths,
                s.nudgeThresholdSec,
                s.trackedDomains,
                s.shareLevel,
                s.shareStreak,
                s.shareCategories,
                s.shareMoments
        ));
    }
}