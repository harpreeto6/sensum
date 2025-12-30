package com.sensum.backend.friends;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {
    List<Friendship> findByUserId(Long userId);
    Optional<Friendship> findByUserIdAndFriendId(Long userId, Long friendId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Friendship f WHERE f.userId = :userId AND f.friendId = :friendId")
    void deletePair(@Param("userId") Long userId, @Param("friendId") Long friendId);
}