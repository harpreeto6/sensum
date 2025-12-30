package com.sensum.backend.quest;

import com.sensum.backend.user.User;
import com.sensum.backend.user.UserRepository;
import com.sensum.backend.achievement.AchievementService;
import com.sensum.backend.achievement.Achievement;
import com.sensum.backend.friends.FriendshipRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/quests")
public class QuestController {

    private final QuestRepository questRepo;
    private final UserRepository userRepo;
    private final QuestCompletionRepository completionRepo;
    private final FriendshipRepository friendshipRepo;
    private AchievementService achievementService;

    public QuestController(
            QuestRepository questRepo,
            UserRepository userRepo,
            QuestCompletionRepository completionRepo,
            AchievementService achievementService,
            FriendshipRepository friendshipRepo
    ) {
        this.questRepo = questRepo;
        this.userRepo = userRepo;
        this.completionRepo = completionRepo;
        this.achievementService = achievementService;
        this.friendshipRepo = friendshipRepo;
    }

    // GET /quests/recommendations?path=calm
    @GetMapping("/recommendations")
    public List<Quest> recommendations(@RequestParam String path) {
        List<Quest> pool = questRepo.findByCategory(path);
        Collections.shuffle(pool);
        return pool.stream().limit(3).toList();
    }

    // POST /quests/complete
    @PostMapping("/complete")
    public ResponseEntity<?> complete(@RequestBody CompleteRequest req) {
        Quest q = questRepo.findById(req.questId).orElseThrow();
        User u = userRepo.findById(req.userId).orElseThrow();

        // 1) insert completion row
        QuestCompletion c = new QuestCompletion();
        c.userId = req.userId;
        c.questId = req.questId;
        c.mood = req.mood;
        c.momentText = req.momentText;
        completionRepo.save(c);

        // 2) update progress
        int gainedXp = (q.durationSec / 60) * 10; // simple rule
        u.xp += gainedXp;
        u.level = 1 + (u.xp / 500);

        LocalDate today = LocalDate.now();
        if (u.lastCompletedDate == null) {
            u.streak = 1;
        } else if (u.lastCompletedDate.equals(today)) {
            // same day -> streak unchanged
        } else if (u.lastCompletedDate.equals(today.minusDays(1))) {
            u.streak += 1;
        } else {
            u.streak = 1;
        }
        u.lastCompletedDate = today;
        userRepo.save(u);

        // 3) build stats for achievements
        Map<String, Integer> userStats = new HashMap<>();
        userStats.put("questCount", (int) completionRepo.countByUserId(req.userId));
        userStats.put("streak", u.streak);
        userStats.put("level", u.level);
        long friendCount = friendshipRepo.countByUserIdAndStatus(req.userId, "accepted");
        userStats.put("friendCount", (int) friendCount);

        // 4) unlock achievements
        List<Achievement> newAchievements = achievementService.unlockAchievementsForUser(req.userId, userStats);

        // 5) build response
        Map<String, Object> response = new HashMap<>();
        response.put("xp", u.xp);
        response.put("level", u.level);
        response.put("streak", u.streak);
        response.put("gainedXp", gainedXp);
        response.put("newAchievements", newAchievements.stream().map(a -> Map.of(
                "id", a.getId(),
                "name", a.getName(),
                "icon", a.getIcon(),
                "description", a.getDescription()
        )).toList());

        return ResponseEntity.ok(response);
    }

    // ---- DTOs (request/response) ----
    public static class CompleteRequest {
        public Long userId;
        public Long questId;
        public String mood;
        public String momentText;
    }

    public record ProgressResponse(int xp, int level, int streak, int gainedXp) {}
}




