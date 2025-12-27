package com.sensum.backend.quest;

import com.sensum.backend.user.User;
import com.sensum.backend.user.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/quests")
public class QuestController {

    private final QuestRepository questRepo;
    private final UserRepository userRepo;
    private final QuestCompletionRepository completionRepo;

    public QuestController(
            QuestRepository questRepo,
            UserRepository userRepo,
            QuestCompletionRepository completionRepo
    ) {
        this.questRepo = questRepo;
        this.userRepo = userRepo;
        this.completionRepo = completionRepo;
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
    public ProgressResponse complete(@RequestBody CompleteRequest req) {
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

        return new ProgressResponse(u.xp, u.level, u.streak, gainedXp);
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




