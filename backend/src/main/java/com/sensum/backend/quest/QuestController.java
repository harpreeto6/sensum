package com.sensum.backend.quest;

import com.sensum.backend.user.User;
import com.sensum.backend.user.UserRepository;
import com.sensum.backend.achievement.AchievementService;
import com.sensum.backend.achievement.Achievement;
import com.sensum.backend.friends.FriendshipRepository;
import com.sensum.backend.moments.Moment;
import com.sensum.backend.moments.MomentRepository;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

/**
 * Quest API for the Sensum backend.
 *
 * <h2>Concepts</h2>
 * A "quest" is a small, time-boxed action (e.g., breathe for 2 minutes) intended to gently interrupt
 * doomscrolling and steer a user toward healthier behavior.
 *
 * <h2>Main responsibilities</h2>
 * <ul>
 *   <li>Recommend quests for a given path/category.</li>
 *   <li>Record quest completions and update user progress (XP/level/streak).</li>
 *   <li>Record interaction outcomes (completed/skipped/snoozed) to drive personalization.</li>
 *   <li>Trigger achievement evaluation after a completion.</li>
 * </ul>
 *
 * <h2>Authentication</h2>
 * Most endpoints require an authenticated user. The authenticated user id is injected into the
 * {@link HttpServletRequest} by the JWT auth filter and read from the request attribute "userId".
 */
@RestController
@RequestMapping("/quests")
public class QuestController {

    private final QuestRepository questRepo;
    private final UserRepository userRepo;
    private final QuestCompletionRepository completionRepo;
    private final FriendshipRepository friendshipRepo;
    private final QuestOutcomeRepository outcomeRepo;
    private final MomentRepository momentRepo;
    private AchievementService achievementService;

    public QuestController(
            QuestRepository questRepo,
            UserRepository userRepo,
            QuestCompletionRepository completionRepo,
            AchievementService achievementService,
            FriendshipRepository friendshipRepo,
            QuestOutcomeRepository outcomeRepo,
            MomentRepository momentRepo
    ) {
        this.questRepo = questRepo;
        this.userRepo = userRepo;
        this.completionRepo = completionRepo;
        this.achievementService = achievementService;
        this.friendshipRepo = friendshipRepo;
        this.outcomeRepo = outcomeRepo;
        this.momentRepo = momentRepo;
    }

    /**
     * Returns up to 3 quest recommendations for the given path/category.
     *
     * <p>If the caller is not authenticated (no userId on the request), this endpoint falls back to a simple
     * random shuffle and returns 3 items.</p>
     *
     * <p>If authenticated, this endpoint computes a score for each quest using the user's historical outcomes
     * (completed increases score, skipped decreases score) and returns the top results with a small random
     * component so results are not identical every time.</p>
     *
     * @param path quest category/path (e.g., "calm")
     * @param httpReq current HTTP request (used to read authenticated userId)
     * @return list of up to 3 quests
     */
    @GetMapping("/recommendations")
    public List<Quest> recommendations(@RequestParam String path, HttpServletRequest httpReq) {
        Long userId = (Long) httpReq.getAttribute("userId");
        
        List<Quest> pool = questRepo.findByCategory(path);
        
        // If user is not logged in, or no history yet, just shuffle.
        if (userId == null || pool.isEmpty()) {
            Collections.shuffle(pool);
            return pool.stream().limit(3).toList();
        }
        
        // Calculate scores for each quest.
        Map<Long, Double> scores = calculateQuestScores(userId, pool);
        
        // Sort by score (higher = better), but add some randomness.
        List<Quest> sorted = pool.stream()
            .sorted((q1, q2) -> {
                double score1 = scores.getOrDefault(q1.getId(), 0.0);
                double score2 = scores.getOrDefault(q2.getId(), 0.0);
                // Add small random factor so it's not always the same 3
                double random1 = Math.random() * 0.5; // 0 to 0.5
                double random2 = Math.random() * 0.5;
                return Double.compare(score2 + random2, score1 + random1);
            })
            .toList();
        
        return sorted.stream().limit(3).toList();
    }
    
    /**
     * Computes per-quest scores for the given user.
     *
     * <p>Scoring model (v1):</p>
     * $$score = 2 \times completed - 1 \times skipped$$
     *
     * <p>Notes:</p>
     * <ul>
     *   <li>"snoozed" is recorded but not currently used in scoring.</li>
     *   <li>Unknown quests (no outcomes) default to 0.0.</li>
     * </ul>
     *
     * @param userId authenticated user id
     * @param quests candidate quests
     * @return map questId -> score
     */
    private Map<Long, Double> calculateQuestScores(Long userId, List<Quest> quests) {
        Map<Long, Double> scores = new HashMap<>();
        
        // Get all outcomes for this user at once.
        List<QuestOutcomeRepository.QuestScoreProjection> userScores = 
            outcomeRepo.getQuestScoresForUser(userId);
        
        // Build a map: questId -> score.
        Map<Long, Double> outcomeScores = new HashMap<>();
        for (var proj : userScores) {
            long completed = proj.getCompleted();
            long skipped = proj.getSkipped();
            // Score formula: completed worth +2, skipped worth -1.
            double score = (completed * 2.0) - (skipped * 1.0);
            outcomeScores.put(proj.getQuestId(), score);
        }
        
        // For each quest in the pool, get its score (or 0 if never tried).
        for (Quest q : quests) {
            scores.put(q.getId(), outcomeScores.getOrDefault(q.getId(), 0.0));
        }
        
        return scores;
    }

    /**
     * Records a quest completion and updates the authenticated user's progress.
     *
     * <h3>What this does</h3>
     * <ol>
     *   <li>Validates request and loads quest/user.</li>
     *   <li>Creates a {@link QuestCompletion} row (the user's "moment" reflection).</li>
     *   <li>Creates a {@link QuestOutcome} row with outcome="completed" (for personalization).</li>
     *   <li>Updates user XP/level/streak.</li>
     *   <li>Evaluates achievements and returns newly unlocked achievements.</li>
     * </ol>
     *
     * <p>Security note: request.userId is ignored; the authenticated userId is used instead.</p>
     */
    @PostMapping("/complete")
    public ResponseEntity<?> complete(@RequestBody CompleteRequest req, HttpServletRequest httpReq) {
        Long authUserId = (Long) httpReq.getAttribute("userId");
        if (authUserId == null) {
            return ResponseEntity.status(401).build();
        }

        if (req.questId == null) {
            throw new IllegalArgumentException("questId is required");
        }

        Quest q = questRepo.findById(req.questId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid questId"));

        User u = userRepo.findById(authUserId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid userId"));

        if (req.momentText != null && req.momentText.length() > 200) {
            throw new IllegalArgumentException("momentText must be 200 characters or less");
        }
        
        if (req.mood != null && req.mood.length() > 40) {
            throw new IllegalArgumentException("mood is too long");
        }

        // 1) Insert completion row.
        QuestCompletion c = new QuestCompletion();
        c.setUserId(authUserId);
        c.setQuestId(req.questId);
        c.setMood(req.mood);
        c.setMomentText(req.momentText);
        completionRepo.save(c);

        // If the user wrote a reflection, also persist it as a standalone moment.
        if (req.momentText != null) {
            String trimmed = req.momentText.trim();
            if (!trimmed.isEmpty()) {
                Moment m = new Moment();
                m.setUserId(authUserId);
                m.setText(trimmed);
                momentRepo.save(m);
            }
        }

        // Also save as an outcome for personalization.
        QuestOutcome outcome = new QuestOutcome(authUserId, req.questId, "completed");
        outcomeRepo.save(outcome);

        // 2) Update progress.
        int gainedXp = (q.getDurationSec() / 60) * 10; // simple rule
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

        // 3) Build stats for achievements.
        Map<String, Integer> userStats = new HashMap<>();
        userStats.put("questCount", (int) completionRepo.countByUserId(authUserId));
        userStats.put("streak", u.streak);
        userStats.put("level", u.level);
        long friendCount = friendshipRepo.countByUserIdAndStatus(authUserId, "accepted");
        userStats.put("friendCount", (int) friendCount);

        // 4) Unlock achievements.
        List<Achievement> newAchievements = achievementService.unlockAchievementsForUser(authUserId, userStats);

        // 5) Build response.
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

    /**
     * Records that the user skipped/dismissed a quest.
     *
     * <p>This does not change XP/level/streak. It only records a {@link QuestOutcome} with outcome="skipped"
     * to influence future recommendations.</p>
     */
    @PostMapping("/skip")
    public ResponseEntity<?> skip(@RequestBody SkipRequest req, HttpServletRequest httpReq) {
        Long userId = (Long) httpReq.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        
        if (req.questId == null) {
            throw new IllegalArgumentException("questId is required");
        }
        
        // Verify quest exists.
        questRepo.findById(req.questId)
            .orElseThrow(() -> new IllegalArgumentException("Invalid questId"));
        
        // Save the skip outcome.
        QuestOutcome outcome = new QuestOutcome(userId, req.questId, "skipped");
        outcomeRepo.save(outcome);
        
        return ResponseEntity.ok(Map.of("message", "Quest skipped"));
    }
    
    /**
     * Records that the user snoozed a quest.
     *
     * <p>Currently we only record the outcome (outcome="snoozed") and return success. A future v2 feature
     * could store a snooze-until timestamp and suppress recommendations until that time.</p>
     */
    @PostMapping("/snooze")
    public ResponseEntity<?> snooze(@RequestBody SnoozeRequest req, HttpServletRequest httpReq) {
        Long userId = (Long) httpReq.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        
        if (req.questId == null) {
            throw new IllegalArgumentException("questId is required");
        }
        
        // Verify quest exists.
        questRepo.findById(req.questId)
            .orElseThrow(() -> new IllegalArgumentException("Invalid questId"));
        
        // Save the snooze outcome.
        QuestOutcome outcome = new QuestOutcome(userId, req.questId, "snoozed");
        outcomeRepo.save(outcome);
        
        return ResponseEntity.ok(Map.of("message", "Quest snoozed"));
    }
    
    /** Request DTO for /quests/skip. */
    public record SkipRequest(Long questId) {}
    /** Request DTO for /quests/snooze. */
    public record SnoozeRequest(Long questId) {}

    /**
     * Request body for /quests/complete.
     *
     * <p>Note: {@link #userId} is ignored for security; the JWT user is used.</p>
     */
    public static class CompleteRequest {
        public Long userId;
        public Long questId;
        public String mood;
        public String momentText;
    }

    /** Response shape used by some clients (kept for compatibility). */
    public record ProgressResponse(int xp, int level, int streak, int gainedXp) {}
}




