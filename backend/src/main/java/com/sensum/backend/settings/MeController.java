package com.sensum.backend.settings;

import com.sensum.backend.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/me/settings")
/**
 * Legacy endpoint for updating sharing flags.
 *
 * <p>Newer clients should prefer {@link MeSettingsController#updateSettings(MeSettingsController.UpdateSettingsRequest, HttpServletRequest)}
 * which supports partial updates for all settings.
 *
 * <p>This endpoint remains for compatibility but is hardened to only allow updates to the
 * authenticated user's row.
 */
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

    /**
     * Updates the caller's sharing flags.
     *
     * <p>For backward compatibility, the request includes {@code userId}. The server requires
     * that it matches the authenticated user.
     *
     * @return HTTP 200 with updated flags; HTTP 401 if unauthenticated; HTTP 403 if mismatched user
     */
    @PutMapping("/sharing")
    public ResponseEntity<SharingResponse> updateSharing(@RequestBody SharingRequest req, HttpServletRequest request) {
        Long authedUserId = (Long) request.getAttribute("userId");
        if (authedUserId == null) {
            return ResponseEntity.status(401).build();
        }

        if (req == null || req.userId == null) {
            throw new IllegalArgumentException("userId is required");
        }
        if (!authedUserId.equals(req.userId)) {
            return ResponseEntity.status(403).build();
        }

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

        return ResponseEntity.ok(new SharingResponse(
            s.userId,
            s.shareLevel,
            s.shareStreak,
            s.shareCategories,
            s.shareMoments
        ));
    }
}