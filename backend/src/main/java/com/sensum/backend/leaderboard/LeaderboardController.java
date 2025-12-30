package com.sensum.backend.leaderboard;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/leaderboard")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class LeaderboardController {

    @Autowired
    private LeaderboardService leaderboardService;

    // GET /leaderboard/global?type=xp
    @GetMapping("/global")
    public ResponseEntity<?> getGlobalLeaderboard(@RequestParam String type) {
        List<Map<String, Object>> leaderboard = leaderboardService.getGlobalLeaderboard(type);
        return ResponseEntity.ok(leaderboard);
    }

    // GET /leaderboard/friends?userId=1&type=streak
    @GetMapping("/friends")
    public ResponseEntity<?> getFriendsLeaderboard(@RequestParam Long userId, @RequestParam String type) {
        List<Map<String, Object>> leaderboard = leaderboardService.getFriendsLeaderboard(userId, type);
        return ResponseEntity.ok(leaderboard);
    }

    // GET /leaderboard/rank?userId=1&type=level
    @GetMapping("/rank")
    public ResponseEntity<?> getUserRank(@RequestParam Long userId, @RequestParam String type) {
        Map<String, Object> rank = leaderboardService.getUserRank(userId, type);
        return ResponseEntity.ok(rank);
    }
}