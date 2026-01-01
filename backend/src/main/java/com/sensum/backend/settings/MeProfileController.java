package com.sensum.backend.settings;

import com.sensum.backend.user.User;
import com.sensum.backend.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class MeProfileController {

    private final UserRepository userRepo;
    private final UserSettingsRepository settingsRepo;

    public MeProfileController(UserRepository userRepo, UserSettingsRepository settingsRepo) {
        this.userRepo = userRepo;
        this.settingsRepo = settingsRepo;
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "unauthorized",
                    "message", "Not authenticated",
                    "path", request.getRequestURI()
            ));
        }

        User user = userRepo.findById(userId).orElseThrow();
        UserSettings settings = settingsRepo.findById(userId).orElseGet(() -> {
            UserSettings created = new UserSettings();
            created.userId = userId;
            return settingsRepo.save(created);
        });

        return ResponseEntity.ok(Map.of(
                "id", user.id,
                "email", user.email,
                "xp", user.xp,
                "level", user.level,
                "streak", user.streak,
                "settings", settings
        ));
    }
}