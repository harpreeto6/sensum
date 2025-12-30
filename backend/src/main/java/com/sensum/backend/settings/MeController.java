package com.sensum.backend.settings;

import com.sensum.backend.user.UserRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/me/settings")
public class MeController {

    private final UserRepository users;
    private final UserSettingsRepository settings;

    public MeController(UserRepository users, UserSettingsRepository settings) {
        this.users = users;
        this.settings = settings;
    }

    public static class SharingRequest {
        public Long userId;
        public boolean shareLevel;
        public boolean shareStreak;
        public boolean shareCategories;
        public boolean shareMoments;
    }

    public record SharingResponse(
            Long userId,
            boolean shareLevel,
            boolean shareStreak,
            boolean shareCategories,
            boolean shareMoments
    ) {}

    @PutMapping("/sharing")
    public SharingResponse updateSharing(@RequestBody SharingRequest req) {
        // Validate user exists
        users.findById(req.userId).orElseThrow();

        // Load or create settings row
        UserSettings s = settings.findById(req.userId).orElse(null);
        if (s == null) {
            s = new UserSettings();
            s.userId = req.userId;
        }

        // Update toggles
        s.shareLevel = req.shareLevel;
        s.shareStreak = req.shareStreak;
        s.shareCategories = req.shareCategories;
        s.shareMoments = req.shareMoments;

        settings.save(s);

        return new SharingResponse(
                s.userId,
                s.shareLevel,
                s.shareStreak,
                s.shareCategories,
                s.shareMoments
        );
    }
}