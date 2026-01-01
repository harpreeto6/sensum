package com.sensum.backend.buddy;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.sensum.backend.user.UserRepository;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/buddy")
@CrossOrigin(origins = "*", allowedHeaders = "*")
/**
 * Accountability buddy endpoints for starting and managing a focused session with a friend.
 *
 * <p>Sessions are persisted via {@link BuddySessionRepository} and status updates are stored as
 * {@link BuddyCheckin} rows.
 *
 * <h2>Authentication</h2>
 * Requires the JWT cookie; requests are authorized by verifying that the requested user id
 * matches the authenticated user id set by {@link com.sensum.backend.security.JwtAuthenticationFilter}.
 */
public class BuddyController {

    @Autowired
    private BuddySessionRepository sessionRepository;

    @Autowired
    private BuddyCheckinRepository checkinRepository;

    @Autowired
    private UserRepository userRepository;

    // Request DTOs (data classes for receiving JSON from frontend)
    public static class StartSessionRequest {
        public Long userId;
        public Long friendId;
        public String mode;
        public Integer durationMinutes;
    }

    public static class JoinSessionRequest {
        public Long sessionId;
        public Long userId;
    }

    public static class CheckinRequest {
        public Long sessionId;
        public Long userId;
        public String status;
    }

    public static class EndSessionRequest {
        public Long sessionId;
        public Long userId;
    }

    // POST /buddy/start - User A creates a session
    @PostMapping("/start")
    /**
     * Creates a new buddy session between user A and user B.
     */
    public ResponseEntity<?> startSession(@RequestBody StartSessionRequest req, HttpServletRequest request) {
        Long authedUserId = (Long) request.getAttribute("userId");
        if (authedUserId == null) {
            return ResponseEntity.status(401).build();
        }
        if (req == null || req.userId == null || req.friendId == null) {
            throw new IllegalArgumentException("userId and friendId are required");
        }
        if (!authedUserId.equals(req.userId)) {
            return ResponseEntity.status(403).build();
        }

        if (!userRepository.existsById(req.userId) || !userRepository.existsById(req.friendId)) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }

        BuddySession session = new BuddySession(req.userId, req.friendId, req.mode, req.durationMinutes);
        BuddySession saved = sessionRepository.save(session);

        return ResponseEntity.ok(Map.of(
                "id", saved.getId(),
                "mode", saved.getMode(),
                "durationMinutes", saved.getDurationMinutes(),
                "status", saved.getStatus(),
                "createdAt", saved.getCreatedAt()
        ));
    }

    // POST /buddy/join - User B joins, session becomes active
    @PostMapping("/join")
    /**
     * Marks a session active when one of its participants joins.
     */
    public ResponseEntity<?> joinSession(@RequestBody JoinSessionRequest req, HttpServletRequest request) {
        Long authedUserId = (Long) request.getAttribute("userId");
        if (authedUserId == null) {
            return ResponseEntity.status(401).build();
        }
        if (req == null || req.userId == null || req.sessionId == null) {
            throw new IllegalArgumentException("userId and sessionId are required");
        }
        if (!authedUserId.equals(req.userId)) {
            return ResponseEntity.status(403).build();
        }

        Optional<BuddySession> optSession = sessionRepository.findById(req.sessionId);
        if (optSession.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        BuddySession session = optSession.get();

        // Verify user is one of the two
        if (!session.getUserAId().equals(req.userId) && !session.getUserBId().equals(req.userId)) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not in this session"));
        }

        // If pending, make it active
        if ("pending".equals(session.getStatus())) {
            session.setStatus("active");
            session.setStartedAt(Instant.now());
            sessionRepository.save(session);
        }

        return ResponseEntity.ok(Map.of(
                "id", session.getId(),
                "status", session.getStatus(),
                "startedAt", session.getStartedAt()
        ));
    }

    // POST /buddy/checkin - Record a status update
    @PostMapping("/checkin")
    /**
     * Records a check-in status for a session.
     */
    public ResponseEntity<?> checkin(@RequestBody CheckinRequest req, HttpServletRequest request) {
        Long authedUserId = (Long) request.getAttribute("userId");
        if (authedUserId == null) {
            return ResponseEntity.status(401).build();
        }
        if (req == null || req.userId == null || req.sessionId == null || req.status == null) {
            throw new IllegalArgumentException("sessionId, userId, and status are required");
        }
        if (!authedUserId.equals(req.userId)) {
            return ResponseEntity.status(403).build();
        }

        Optional<BuddySession> optSession = sessionRepository.findById(req.sessionId);
        if (optSession.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        BuddySession session = optSession.get();
        if (!session.getUserAId().equals(req.userId) && !session.getUserBId().equals(req.userId)) {
            return ResponseEntity.status(403).build();
        }

        BuddyCheckin checkin = new BuddyCheckin(req.sessionId, req.userId, req.status);
        BuddyCheckin saved = checkinRepository.save(checkin);

        return ResponseEntity.ok(Map.of(
                "id", saved.getId(),
                "status", saved.getStatus(),
                "createdAt", saved.getCreatedAt()
        ));
    }

    // GET /buddy/list?userId=1 - Get all sessions for a user
    @GetMapping("/list")
    /**
     * Lists sessions for the authenticated user.
     */
    public ResponseEntity<?> listSessions(@RequestParam Long userId, HttpServletRequest request) {
        Long authedUserId = (Long) request.getAttribute("userId");
        if (authedUserId == null) {
            return ResponseEntity.status(401).build();
        }
        if (!authedUserId.equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        List<BuddySession> sessions = sessionRepository.findByUserId(userId);

        List<Map<String, Object>> result = sessions.stream().map(session -> {
            Map<String, Object> sessionMap = new HashMap<>();
            sessionMap.put("id", session.getId());
            sessionMap.put("userAId", session.getUserAId());
            sessionMap.put("userBId", session.getUserBId());
            sessionMap.put("mode", session.getMode());
            sessionMap.put("durationMinutes", session.getDurationMinutes());
            sessionMap.put("status", session.getStatus());
            sessionMap.put("startedAt", session.getStartedAt());
            sessionMap.put("endedAt", session.getEndedAt());
            sessionMap.put("createdAt", session.getCreatedAt());

            // Get latest check-in from each user
            List<BuddyCheckin> checkinsA = checkinRepository.findBySessionIdAndUserId(session.getId(), session.getUserAId());
            List<BuddyCheckin> checkinsB = checkinRepository.findBySessionIdAndUserId(session.getId(), session.getUserBId());

            sessionMap.put("latestCheckinUserA", !checkinsA.isEmpty() ? Map.of(
                    "status", checkinsA.get(0).getStatus(),
                    "createdAt", checkinsA.get(0).getCreatedAt()
            ) : null);
            sessionMap.put("latestCheckinUserB", !checkinsB.isEmpty() ? Map.of(
                    "status", checkinsB.get(0).getStatus(),
                    "createdAt", checkinsB.get(0).getCreatedAt()
            ) : null);

            return sessionMap;
        }).toList();

        return ResponseEntity.ok(result);
    }

    // GET /buddy/session/{id} - Get session with all check-ins
    @GetMapping("/session/{id}")
    /**
     * Returns a session plus its check-ins.
     */
    public ResponseEntity<?> getSession(@PathVariable Long id, HttpServletRequest request) {
        Long authedUserId = (Long) request.getAttribute("userId");
        if (authedUserId == null) {
            return ResponseEntity.status(401).build();
        }
        Optional<BuddySession> optSession = sessionRepository.findById(id);
        if (optSession.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        BuddySession session = optSession.get();
        if (!session.getUserAId().equals(authedUserId) && !session.getUserBId().equals(authedUserId)) {
            return ResponseEntity.status(403).build();
        }
        List<BuddyCheckin> checkins = checkinRepository.findBySessionId(id);

        Map<String, Object> result = new HashMap<>();
        result.put("id", session.getId());
        result.put("userAId", session.getUserAId());
        result.put("userBId", session.getUserBId());
        result.put("mode", session.getMode());
        result.put("durationMinutes", session.getDurationMinutes());
        result.put("status", session.getStatus());
        result.put("startedAt", session.getStartedAt());
        result.put("endedAt", session.getEndedAt());
        result.put("createdAt", session.getCreatedAt());
        result.put("checkins", checkins.stream().map(c -> Map.of( "id", c.getId(),"userId", c.getUserId(),
                "status", c.getStatus(),
                "createdAt", c.getCreatedAt()
        )).toList());

        return ResponseEntity.ok(result);
    }

    // POST /buddy/end - Mark session as completed
    @PostMapping("/end")
    /**
     * Marks a session completed.
     */
    public ResponseEntity<?> endSession(@RequestBody EndSessionRequest req, HttpServletRequest request) {
        Long authedUserId = (Long) request.getAttribute("userId");
        if (authedUserId == null) {
            return ResponseEntity.status(401).build();
        }
        if (req == null || req.userId == null || req.sessionId == null) {
            throw new IllegalArgumentException("sessionId and userId are required");
        }
        if (!authedUserId.equals(req.userId)) {
            return ResponseEntity.status(403).build();
        }

        Optional<BuddySession> optSession = sessionRepository.findById(req.sessionId);
        if (optSession.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        BuddySession session = optSession.get();
        if (!session.getUserAId().equals(req.userId) && !session.getUserBId().equals(req.userId)) {
            return ResponseEntity.status(403).build();
        }
        session.setStatus("completed");
        session.setEndedAt(Instant.now());
        sessionRepository.save(session);

        return ResponseEntity.ok(Map.of(
                "id", session.getId(),
                "status", session.getStatus(),
                "endedAt", session.getEndedAt()
        ));
    }
}