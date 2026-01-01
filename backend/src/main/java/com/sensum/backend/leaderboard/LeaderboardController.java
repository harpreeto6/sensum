package com.sensum.backend.leaderboard;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/leaderboard")
@CrossOrigin(origins = "*", allowedHeaders = "*")
/**
 * Leaderboard endpoints.
 *
 * <p>Supports global leaderboards and friend-scoped leaderboards by several metrics.
 *
 * <h2>Authentication</h2>
 * Endpoints that accept a {@code userId} verify it matches the authenticated user id set by
 * {@link com.sensum.backend.security.JwtAuthenticationFilter}.
 */
public class LeaderboardController {

    @Autowired
    private LeaderboardService leaderboardService;

    // GET /leaderboard/global?type=xp
    @GetMapping("/global")
    /**
     * Global leaderboard for a metric.
     */
    public ResponseEntity<?> getGlobalLeaderboard(@RequestParam String type) {
        List<Map<String, Object>> leaderboard = leaderboardService.getGlobalLeaderboard(type);
        return ResponseEntity.ok(leaderboard);
    }

    // GET /leaderboard/friends?userId=1&type=streak
    @GetMapping("/friends")
    /**
     * Friend-scoped leaderboard for the authenticated user.
     */
    public ResponseEntity<?> getFriendsLeaderboard(@RequestParam Long userId, @RequestParam String type, HttpServletRequest request) {
        Long authedUserId = (Long) request.getAttribute("userId");
        if (authedUserId == null) {
            return ResponseEntity.status(401).build();
        }
        if (!authedUserId.equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        List<Map<String, Object>> leaderboard = leaderboardService.getFriendsLeaderboard(userId, type);
        return ResponseEntity.ok(leaderboard);
    }

    // GET /leaderboard/rank?userId=1&type=level
    @GetMapping("/rank")
    /**
     * Returns the authenticated user's rank for a given metric.
     */
    public ResponseEntity<?> getUserRank(@RequestParam Long userId, @RequestParam String type, HttpServletRequest request) {
        Long authedUserId = (Long) request.getAttribute("userId");
        if (authedUserId == null) {
            return ResponseEntity.status(401).build();
        }
        if (!authedUserId.equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        Map<String, Object> rank = leaderboardService.getUserRank(userId, type);
        return ResponseEntity.ok(rank);
    }
}