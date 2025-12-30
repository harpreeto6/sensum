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

@RestController
@RequestMapping("/friends")
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
    public InviteResponse invite(@RequestBody InviteRequest req) {
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
        inv.code = code;
        inv.inviterId = inviter.id;
        inv.expiresAt = Instant.now().plus(7, ChronoUnit.DAYS);
        invites.save(inv);

        String link = "http://localhost:3000/friends?code=" + code;
        return new InviteResponse(code, link);
    }

    // ---- 2) POST /friends/accept ----
    @PostMapping("/accept")
    public String accept(@RequestBody AcceptRequest req) {
        User accepter = users.findById(req.userId).orElseThrow();

        Invite inv = invites.findByCode(req.code).orElseThrow(() -> new RuntimeException("Invalid code"));
        if (inv.usedAt != null) throw new RuntimeException("Invite already used");
        if (Instant.now().isAfter(inv.expiresAt)) throw new RuntimeException("Invite expired");
        if (inv.inviterId.equals(accepter.id)) throw new RuntimeException("Cannot accept your own invite");

        // Create accepted friendships in both directions (upsert-ish)
        upsertFriendship(inv.inviterId, accepter.id, "accepted");
        upsertFriendship(accepter.id, inv.inviterId, "accepted");

        inv.usedAt = Instant.now();
        invites.save(inv);

        return "ok";
    }

    // ---- 3) GET /friends?userId= ----
    @GetMapping
    public List<FriendRow> list(@RequestParam Long userId) {
        users.findById(userId).orElseThrow();

        List<Friendship> rows = friendships.findByUserId(userId);
        List<FriendRow> out = new ArrayList<>();

        for (Friendship f : rows) {
            User friend = users.findById(f.friendId).orElse(null);
            out.add(new FriendRow(f.friendId, friend == null ? "(deleted)" : friend.email, f.status));
        }

        return out;
    }

    // ---- 4) DELETE /friends/{friendId}?userId= ----
    @DeleteMapping("/{friendId}")
    public String remove(@PathVariable Long friendId, @RequestParam Long userId) {
        users.findById(userId).orElseThrow();

        friendships.deletePair(userId, friendId);
        friendships.deletePair(friendId, userId);

        return "ok";
    }

    // ---- 5) POST /friends/{friendId}/block ----
    @PostMapping("/{friendId}/block")
    public String block(@PathVariable Long friendId, @RequestParam Long userId) {
        users.findById(userId).orElseThrow();
        users.findById(friendId).orElseThrow();

        upsertFriendship(userId, friendId, "blocked");
        upsertFriendship(friendId, userId, "blocked");
        return "ok";
    }

    // ---- helpers ----
    private void upsertFriendship(Long userId, Long friendId, String status) {
        Friendship f = friendships.findByUserIdAndFriendId(userId, friendId).orElse(null);
        if (f == null) {
            f = new Friendship();
            f.userId = userId;
            f.friendId = friendId;
            f.status = status;
            friendships.save(f);
        } else {
            f.status = status;
            friendships.save(f);
        }
    }

    private static final SecureRandom RNG = new SecureRandom();
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

    private static String randomCode(int len) {
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) {
            sb.append(ALPHABET.charAt(RNG.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }


    @GetMapping("/feed")
    public List<FeedItem> feed(@RequestParam Long userId) {
        users.findById(userId).orElseThrow();

        // 1) Get accepted friends
        List<Friendship> rows = friendships.findByUserId(userId);
        List<Long> acceptedFriendIds = new ArrayList<>();
        for (Friendship f : rows) {
            if ("accepted".equals(f.status)) acceptedFriendIds.add(f.friendId);
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
                Quest q = questRepo.findById(c.questId).orElse(null);

                FeedItem item = new FeedItem();
                item.friendId = friendId;
                item.friendEmail = friend.email;
                item.at = c.completedAt;

                if (shareLevel) { item.level = friend.level; item.xp = friend.xp; }
                if (shareStreak) { item.streak = friend.streak; }
                if (shareCategories) { item.category = q == null ? null : q.category; }
                if (shareMoments) { item.momentText = c.momentText; }

                items.add(item);
            }
        }

        // 3) Sort by time desc and limit 10
        items.sort((a, b) -> b.at.compareTo(a.at));
        return items.stream().limit(10).toList();
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