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

@RestController
@RequestMapping("/buddy")
@CrossOrigin(origins = "*", allowedHeaders = "*")
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
    public ResponseEntity<?> startSession(@RequestBody StartSessionRequest req) {
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
    public ResponseEntity<?> joinSession(@RequestBody JoinSessionRequest req) {
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
    public ResponseEntity<?> checkin(@RequestBody CheckinRequest req) {
        Optional<BuddySession> optSession = sessionRepository.findById(req.sessionId);
        if (optSession.isEmpty()) {
            return ResponseEntity.notFound().build();
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
    public ResponseEntity<?> listSessions(@RequestParam Long userId) {
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
    public ResponseEntity<?> getSession(@PathVariable Long id) {
        Optional<BuddySession> optSession = sessionRepository.findById(id);
        if (optSession.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        BuddySession session = optSession.get();
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
    public ResponseEntity<?> endSession(@RequestBody EndSessionRequest req) {
        Optional<BuddySession> optSession = sessionRepository.findById(req.sessionId);
        if (optSession.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        BuddySession session = optSession.get();
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