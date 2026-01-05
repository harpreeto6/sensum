package com.sensum.backend.moments;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/me/moments")
/**
 * Endpoints for standalone moments (reflections) not tied to quest completions.
 *
 * <p>Authentication: requires the JWT cookie; user id is read from request attribute "userId"
 * (set by JwtAuthenticationFilter).
 */
public class MeMomentsController {

    private final MomentRepository momentRepo;

    public MeMomentsController(MomentRepository momentRepo) {
        this.momentRepo = momentRepo;
    }

    public record MomentResponse(Long id, String text, Instant createdAt) {
    }

    public record CreateMomentRequest(String text) {
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(name = "limit", defaultValue = "50") int limit,
                                 HttpServletRequest req) {
        Long userId = (Long) req.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        int safeLimit = Math.min(Math.max(limit, 1), 200);

        List<Moment> moments = momentRepo.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, safeLimit));

        return ResponseEntity.ok(
                moments.stream().map(m -> new MomentResponse(m.getId(), m.getText(), m.getCreatedAt())).toList()
        );
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateMomentRequest body, HttpServletRequest req) {
        Long userId = (Long) req.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        String text = body == null ? null : body.text();
        if (text == null || text.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("text is required");
        }

        String trimmed = text.trim();
        if (trimmed.length() > 200) {
            return ResponseEntity.badRequest().body("text must be 200 characters or less");
        }

        Moment m = new Moment();
        m.setUserId(userId);
        m.setText(trimmed);
        Moment saved = momentRepo.save(m);

        return ResponseEntity.ok(new MomentResponse(saved.getId(), saved.getText(), saved.getCreatedAt()));
    }
}
