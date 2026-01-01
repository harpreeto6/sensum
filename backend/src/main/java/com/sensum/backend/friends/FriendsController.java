package com.sensum.backend.friends;

import com.sensum.backend.quest.Quest;
import com.sensum.backend.quest.QuestCompletion;
import com.sensum.backend.quest.QuestCompletionRepository;
import com.sensum.backend.quest.QuestRepository;
import com.sensum.backend.settings.UserSettings;
import com.sensum.backend.settings.UserSettingsRepository;
import com.sensum.backend.user.User;
import com.sensum.backend.user.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/friends")
/**
 * Social graph endpoints: invites, friend list, blocking, and an activity feed.
 *
 * <p>This controller currently uses user ids supplied by the client for several endpoints.
 * To prevent cross-user access, each endpoint verifies that the requested user id matches the
 * authenticated user id from {@link com.sensum.backend.security.JwtAuthenticationFilter}.
 */
public class FriendsController {

    private final FriendshipRepository friendships;
    private final InviteRepository invites;
    private final UserRepository users;
    private final UserSettingsRepository settingsRepo;
    private final QuestCompletionRepository completionRepo;
    private final QuestRepository questRepo;

    public FriendsController(
            FriendshipRepository friendships,
            InviteRepository invites,
            UserRepository users,
            UserSettingsRepository settingsRepo,
            QuestCompletionRepository completionRepo,
            QuestRepository questRepo
    ) {
        this.friendships = friendships;
        this.invites = invites;
        this.users = users;
        this.settingsRepo = settingsRepo;
        this.completionRepo = completionRepo;
        this.questRepo = questRepo;
    }

    // ---- DTOs ----
    public static class InviteRequest { public Long userId; }
    public static class InviteResponse { public String code; public String link;
        public InviteResponse(String code, String link) { this.code = code; this.link = link; }
    }

    public static class AcceptRequest { public Long userId; public String code; }

    public record FriendRow(Long friendId, String friendEmail, String status) {}

    // ---- 1) POST /friends/invite ----
    @PostMapping("/invite")
    /**
     * Creates a one-time invite code for the authenticated user.
     *
     * @return HTTP 200 with invite code + link; HTTP 401 if unauthenticated; HTTP 403 on user mismatch
     */
    public ResponseEntity<InviteResponse> invite(@RequestBody InviteRequest req, HttpServletRequest request) {
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

        User inviter = users.findById(req.userId).orElseThrow();

        // generate code (retry a few times in case of collision)
        String code = null;
        for (int i = 0; i < 5; i++) {
            String candidate = randomCode(8);
            if (invites.findByCode(candidate).isEmpty()) {
                code = candidate;
                break;
            }
        }
        if (code == null) throw new RuntimeException("Could not generate invite code");

        Invite inv = new Invite();
        inv.setCode(code);
        inv.setInviterId(inviter.getId());
        inv.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));
        invites.save(inv);

        String link = "http://localhost:3000/friends?code=" + code;
        return ResponseEntity.ok(new InviteResponse(code, link));
    }

    // ---- 2) POST /friends/accept ----
    @PostMapping("/accept")
    /**
     * Accepts an invite code and creates an accepted friendship pair.
     *
     * @return HTTP 200 "ok"; HTTP 401 if unauthenticated; HTTP 403 on user mismatch
     */
    public ResponseEntity<String> accept(@RequestBody AcceptRequest req, HttpServletRequest request) {
        Long authedUserId = (Long) request.getAttribute("userId");
        if (authedUserId == null) {
            return ResponseEntity.status(401).build();
        }
        if (req == null || req.userId == null || req.code == null || req.code.isBlank()) {
            throw new IllegalArgumentException("userId and code are required");
        }
        if (!authedUserId.equals(req.userId)) {
            return ResponseEntity.status(403).build();
        }

        User accepter = users.findById(req.userId).orElseThrow();

        Invite inv = invites.findByCode(req.code).orElseThrow(() -> new RuntimeException("Invalid code"));
        if (inv.getUsedAt() != null) throw new RuntimeException("Invite already used");
        if (Instant.now().isAfter(inv.getExpiresAt())) throw new RuntimeException("Invite expired");
        if (inv.getInviterId().equals(accepter.getId())) throw new RuntimeException("Cannot accept your own invite");

        // Create accepted friendships in both directions (upsert-ish)
        upsertFriendship(inv.getInviterId(), accepter.getId(), "accepted");
        upsertFriendship(accepter.getId(), inv.getInviterId(), "accepted");

        inv.setUsedAt(Instant.now());
        invites.save(inv);

        return ResponseEntity.ok("ok");
    }

    // ---- 3) GET /friends?userId= ----
    @GetMapping
    /**
     * Lists friends for the authenticated user.
     */
    public ResponseEntity<List<FriendRow>> list(@RequestParam Long userId, HttpServletRequest request) {
        Long authedUserId = (Long) request.getAttribute("userId");
        if (authedUserId == null) {
            return ResponseEntity.status(401).build();
        }
        if (!authedUserId.equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        users.findById(userId).orElseThrow();

        List<Friendship> rows = friendships.findByUserId(userId);
        List<FriendRow> out = new ArrayList<>();

        for (Friendship f : rows) {
            User friend = users.findById(f.getFriendId()).orElse(null);
            out.add(new FriendRow(f.getFriendId(), friend == null ? "(deleted)" : friend.getEmail(), f.getStatus()));
        }

        return ResponseEntity.ok(out);
    }

    // ---- 4) DELETE /friends/{friendId}?userId= ----
    @DeleteMapping("/{friendId}")
    /**
     * Removes a friendship pair.
     */
    public ResponseEntity<String> remove(@PathVariable Long friendId, @RequestParam Long userId, HttpServletRequest request) {
        Long authedUserId = (Long) request.getAttribute("userId");
        if (authedUserId == null) {
            return ResponseEntity.status(401).build();
        }
        if (!authedUserId.equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        users.findById(userId).orElseThrow();

        friendships.deletePair(userId, friendId);
        friendships.deletePair(friendId, userId);

        return ResponseEntity.ok("ok");
    }

    // ---- 5) POST /friends/{friendId}/block ----
    @PostMapping("/{friendId}/block")
    /**
     * Blocks a user in both directions.
     */
    public ResponseEntity<String> block(@PathVariable Long friendId, @RequestParam Long userId, HttpServletRequest request) {
        Long authedUserId = (Long) request.getAttribute("userId");
        if (authedUserId == null) {
            return ResponseEntity.status(401).build();
        }
        if (!authedUserId.equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        users.findById(userId).orElseThrow();
        users.findById(friendId).orElseThrow();

        upsertFriendship(userId, friendId, "blocked");
        upsertFriendship(friendId, userId, "blocked");
        return ResponseEntity.ok("ok");
    }

    // ---- helpers ----
    /**
     * Upserts a directional friendship edge to the desired status.
     *
     * <p>This method is used to maintain the "two rows" model (A->B and B->A).
     */
    private void upsertFriendship(Long userId, Long friendId, String status) {
        Friendship f = friendships.findByUserIdAndFriendId(userId, friendId).orElse(null);
        if (f == null) {
            f = new Friendship();
            f.setUserId(userId);
            f.setFriendId(friendId);
            f.setStatus(status);
            friendships.save(f);
        } else {
            f.setStatus(status);
            friendships.save(f);
        }
    }

    /**
     * Secure RNG for invite codes.
     */
    private static final SecureRandom RNG = new SecureRandom();

    /**
     * Alphabet chosen to avoid ambiguous characters (0/O/1/I).
     */
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

    /**
     * Generates a short invite code.
     *
     * @param len desired length
     */
    private static String randomCode(int len) {
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) {
            sb.append(ALPHABET.charAt(RNG.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }


    @GetMapping("/feed")
    /**
     * Builds a small friend activity feed from recent quest completions.
     *
     * <p>Visibility is controlled by the friend's sharing flags in {@link UserSettings}.
     */
    public ResponseEntity<List<FeedItem>> feed(@RequestParam Long userId, HttpServletRequest request) {
        Long authedUserId = (Long) request.getAttribute("userId");
        if (authedUserId == null) {
            return ResponseEntity.status(401).build();
        }
        if (!authedUserId.equals(userId)) {
            return ResponseEntity.status(403).build();
        }
        users.findById(userId).orElseThrow();

        // 1) Get accepted friends
        List<Friendship> rows = friendships.findByUserId(userId);
        List<Long> acceptedFriendIds = new ArrayList<>();
        for (Friendship f : rows) {
            if ("accepted".equals(f.getStatus())) acceptedFriendIds.add(f.getFriendId());
        }

        // 2) Build items
        List<FeedItem> items = new ArrayList<>();

        for (Long friendId : acceptedFriendIds) {
            User friend = users.findById(friendId).orElse(null);
            if (friend == null) continue;

            UserSettings s = settingsRepo.findById(friendId).orElse(null);
            boolean shareLevel = s != null && s.shareLevel;
            boolean shareStreak = s != null && s.shareStreak;
            boolean shareCategories = s != null && s.shareCategories;
            boolean shareMoments = s != null && s.shareMoments;

            // If they share nothing, skip them
            if (!shareLevel && !shareStreak && !shareCategories && !shareMoments) continue;

            List<QuestCompletion> completions = completionRepo.findTop10ByUserIdOrderByCompletedAtDesc(friendId);

            for (QuestCompletion c : completions) {
                Quest q = questRepo.findById(c.getQuestId()).orElse(null);

                FeedItem item = new FeedItem();
                item.friendId = friendId;
                item.friendEmail = friend.getEmail();
                item.at = c.getCompletedAt();

                if (shareLevel) { item.level = friend.getLevel(); item.xp = friend.getXp(); }
                if (shareStreak) { item.streak = friend.getStreak(); }
                if (shareCategories) { item.category = q == null ? null : q.getCategory(); }
                if (shareMoments) { item.momentText = c.getMomentText(); }

                items.add(item);
            }
        }

        // 3) Sort by time desc and limit 10
        items.sort((a, b) -> b.at.compareTo(a.at));
        return ResponseEntity.ok(items.stream().limit(10).toList());
    }

    // DTO returned by /friends/feed
    public static class FeedItem {
        public Long friendId;
        public String friendEmail;
        public java.time.Instant at;

        public Integer xp;       // nullable if not shared
        public Integer level;    // nullable if not shared
        public Integer streak;   // nullable if not shared
        public String category;  // nullable if not shared
        public String momentText; // nullable if not shared
    }
}