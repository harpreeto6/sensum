package com.sensum.backend.friends;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

/**
 * Persistence operations for {@link Friendship} edges.
 */
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    /**
     * Lists all friendship edges for a user.
     */
    List<Friendship> findByUserId(Long userId);

    /**
     * Looks up a single directional edge.
     */
    Optional<Friendship> findByUserIdAndFriendId(Long userId, Long friendId);

    @Modifying
    @Transactional
    /**
     * Deletes a directional edge (userId -> friendId), if present.
     */
    @Query("DELETE FROM Friendship f WHERE f.userId = :userId AND f.friendId = :friendId")
    void deletePair(@Param("userId") Long userId, @Param("friendId") Long friendId);

    /**
     * Counts edges for a user with a given status.
     */
    @Query("SELECT COUNT(f) FROM Friendship f WHERE f.userId = :userId AND f.status = :status")
    long countByUserIdAndStatus(@Param("userId") Long userId, @Param("status") String status);
}