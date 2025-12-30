package com.sensum.backend.leaderboard;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.sensum.backend.user.User;
import com.sensum.backend.user.UserRepository;
import com.sensum.backend.friends.Friendship;
import com.sensum.backend.friends.FriendshipRepository;
import com.sensum.backend.quest.QuestCompletionRepository;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class LeaderboardService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FriendshipRepository friendshipRepository;

    @Autowired
    private QuestCompletionRepository questCompletionRepository;

    /**
     * Get global leaderboard (all users)
     */
    public List<Map<String, Object>> getGlobalLeaderboard(String type) {
        List<User> users = userRepository.findAll();
        return rankUsers(users, type);
    }

    /**
     * Get friends-only leaderboard
     */
    public List<Map<String, Object>> getFriendsLeaderboard(Long userId, String type) {
        // Get all friend IDs
        List<Friendship> friendships = friendshipRepository.findByUserId(userId);
        Set<Long> friendIds = friendships.stream()
                .filter(f -> "accepted".equals(f.getStatus()))
                .map(f->f.friendId)
                .collect(Collectors.toSet());

        // Add self to the list
        friendIds.add(userId);

        // Get users
        List<User> users = userRepository.findAllById(friendIds);
        return rankUsers(users, type);
    }

    /**
     * Get specific user's rank
     */
    public Map<String, Object> getUserRank(Long userId, String type) {
        List<User> allUsers = userRepository.findAll();
        List<Map<String, Object>> ranked = rankUsers(allUsers, type);

        for (int i = 0; i < ranked.size(); i++) {
            Map<String, Object> entry = ranked.get(i);
            if (entry.get("userId").equals(userId)) {
                return Map.of(
                        "rank", i + 1,
                        "total", ranked.size(),
                        "user", entry
                );
            }
        }

        return Map.of("rank", -1, "total", ranked.size());
    }

    /**
     * Rank users by metric and return as list
     */
    private List<Map<String, Object>> rankUsers(List<User> users, String type) {
        // Sort users by the specified metric
        Comparator<User> comparator;

        switch (type) {
            case "xp":
                comparator = Comparator.comparingInt(User::getXp).reversed();
                break;
            case "streak":
                comparator = Comparator.comparingInt(User::getStreak).reversed();
                break;
            case "level":
                comparator = Comparator.comparingInt(User::getLevel).reversed();
                break;
            case "quest_count":
                comparator = (u1, u2) -> {
                    long count1 = questCompletionRepository.countByUserId(u1.getId());
                    long count2 = questCompletionRepository.countByUserId(u2.getId());
                    return Long.compare(count2, count1);
                };
                break;
            default:
                comparator = Comparator.comparingInt(User::getXp).reversed();
        }

        List<User> sortedUsers = users.stream()
                .sorted(comparator)
                .limit(20)
                .collect(Collectors.toList());

        // Build result with rank positions
        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 0; i < sortedUsers.size(); i++) {
            User u = sortedUsers.get(i);
            Map<String, Object> entry = new HashMap<>();
            entry.put("rank", i + 1);
            entry.put("userId", u.getId());
            entry.put("email", u.getEmail());
            entry.put("xp", u.getXp());
            entry.put("level", u.getLevel());
            entry.put("streak", u.getStreak());

            if ("quest_count".equals(type)) {
                entry.put("questCount", questCompletionRepository.countByUserId(u.getId()));
            }

            result.add(entry);
        }

        return result;
    }
}