package com.educationonline.backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.educationonline.backend.entities.PlannerSession;

public interface PlannerSessionRepository extends JpaRepository<PlannerSession, Long> {
    List<PlannerSession> findByStudentId(Long studentId);
    Optional<PlannerSession> findByIdAndStudentId(Long id, Long studentId);
    long deleteByStudentIdAndGeneratedTrue(Long studentId);
    long deleteByStudentId(Long studentId);
}
