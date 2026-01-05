package com.sensum.backend.moments;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MomentRepository extends JpaRepository<Moment, Long> {

    List<Moment> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
