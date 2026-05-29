package com.educationonline.backend.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.educationonline.backend.entities.Points;

public interface PointRepository extends JpaRepository<Points, Long> {


     @Query("""
        SELECT COALESCE(SUM(t.points), 0)
        FROM Points t
        WHERE t.student.id = :studentId
        """)
    int getTotalPointsByStudentId(@Param("studentId") Long studentId);

    /** Full history newest first. */
    List<Points> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    long deleteByStudentId(Long studentId);
}
