package com.sensum.backend.quest;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/me/quests")
/**
 * Endpoints for a user's quest completions.
 *
 * <p>Authentication: requires the JWT cookie; user id is read from request attribute "userId"
 * (set by JwtAuthenticationFilter).
 */
public class MeQuestCompletionsController {

    private final QuestCompletionRepository completionRepo;
    private final QuestRepository questRepo;

    public MeQuestCompletionsController(QuestCompletionRepository completionRepo, QuestRepository questRepo) {
        this.completionRepo = completionRepo;
        this.questRepo = questRepo;
    }

    public record QuestCompletionResponse(
            Long id,
            Long questId,
            String title,
            String category,
            String mood,
            String momentText,
            Instant completedAt
    ) {
    }

    @GetMapping("/completions")
    public ResponseEntity<?> listCompletions(
            @RequestParam(name = "limit", defaultValue = "50") int limit,
            HttpServletRequest req
    ) {
        Long userId = (Long) req.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        int safeLimit = Math.min(Math.max(limit, 1), 200);

        List<QuestCompletion> completions = completionRepo.findByUserIdOrderByCompletedAtDesc(
                userId,
                PageRequest.of(0, safeLimit)
        );

        Map<Long, Quest> questsById = new HashMap<>();
        if (!completions.isEmpty()) {
            List<Quest> quests = questRepo.findAllById(completions.stream().map(QuestCompletion::getQuestId).distinct().toList());
            for (Quest q : quests) {
                questsById.put(q.getId(), q);
            }
        }

        return ResponseEntity.ok(
                completions.stream().map(c -> {
                    Quest q = questsById.get(c.getQuestId());
                    return new QuestCompletionResponse(
                            c.getId(),
                            c.getQuestId(),
                            q == null ? null : q.getTitle(),
                            q == null ? null : q.getCategory(),
                            c.getMood(),
                            c.getMomentText(),
                            c.getCompletedAt()
                    );
                }).toList()
        );
    }
}
