package com.educationonline.backend.repositories;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.educationonline.backend.entities.Progress;

public interface ProgressRepository extends JpaRepository<Progress, Long> {

    boolean existsByStudent_IdAndLesson_Id(Long studentId, Long lessonId);

    boolean existsByStudent_IdAndLesson_IdAndCompletedTrue(Long studentId, Long lessonId);

    long countByStudentIdAndCompletedTrue(Long studentId);

    long countByStudentId(Long studentId);

    @Query("""
            SELECT COUNT(p) FROM Progress p
            WHERE p.student.id = :studentId
            AND p.completed = true
            AND p.lesson.courses.id = :courseId
            """)
    long countCompletedInCourse(@Param("studentId") Long studentId, @Param("courseId") Long courseId);

    @Query("""
            SELECT p.completedAt FROM Progress p
            WHERE p.student.id = :studentId AND p.completed = true AND p.completedAt IS NOT NULL
            """)
    List<LocalDateTime> findCompletionTimesForStudent(@Param("studentId") Long studentId);

}
