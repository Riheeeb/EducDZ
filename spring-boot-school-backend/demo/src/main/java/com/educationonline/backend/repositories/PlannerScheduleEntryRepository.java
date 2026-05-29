package com.educationonline.backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.educationonline.backend.entities.PlannerScheduleEntry;

public interface PlannerScheduleEntryRepository extends JpaRepository<PlannerScheduleEntry, Long> {
    List<PlannerScheduleEntry> findByStudentId(Long studentId);
    Optional<PlannerScheduleEntry> findByIdAndStudentId(Long id, Long studentId);
    long deleteByStudentId(Long studentId);
}
