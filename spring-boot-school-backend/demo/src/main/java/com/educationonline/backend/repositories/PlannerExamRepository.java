package com.educationonline.backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.educationonline.backend.entities.PlannerExam;

public interface PlannerExamRepository extends JpaRepository<PlannerExam, Long> {
    List<PlannerExam> findByStudentId(Long studentId);
    Optional<PlannerExam> findByIdAndStudentId(Long id, Long studentId);
    long deleteByStudentId(Long studentId);
}
