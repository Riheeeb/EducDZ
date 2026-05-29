package com.educationonline.backend.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.educationonline.backend.entities.Badges.BadgeTier;
import com.educationonline.backend.entities.StudentBadge;

public interface StudentBadgeRepository extends JpaRepository<StudentBadge, Long> {

    int countByStudentId(Long studentId);

    boolean existsByStudentIdAndBadgeId(Long studentId, Long badgeId);

    List<StudentBadge> findByStudentIdOrderByEarnedAtDesc(Long studentId);

    boolean existsByStudentIdAndBadgeCode(Long studentId, String code);

    long countByStudentIdAndBadgeTier(Long studentId, BadgeTier tier);

    long countByStudentIdAndEnrollmentIdIn(Long studentId, List<Long> enrollmentIds);

    List<StudentBadge> findByStudentId(Long studentId);

    long deleteByStudentId(Long studentId);
}
