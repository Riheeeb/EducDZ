package com.educationonline.backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.educationonline.backend.entities.Enrollment;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    long countByStudentId(Long studentId);

    long countByStatus(Enrollment.EnrollmentStatus status);

    long countByCoursesId(Long courseId);

    List<Enrollment> findByCoursesId(Long courseId);

    boolean existsByStudentIdAndCoursesId(Long studentId, Long courseId);

    List<Enrollment> findByStudentId(Long studentId);

    Optional<Enrollment> findByStudentIdAndCoursesId(Long studentId, Long courseId);

    long countByCourses_IdAndStatus(Long courseId, Enrollment.EnrollmentStatus status);
 
    
    long countByStudentIdAndStatus(Long studentId, Enrollment.EnrollmentStatus status);
 
    /**
     * All enrollments with full course details (year, subject, teacher).
     * Used to build the year cards on the student profile.
     * Ordered by school year number then enrollment date.
     */
    @Query("""
        SELECT e FROM Enrollment e
        JOIN FETCH e.courses c
        LEFT JOIN FETCH c.stream st
        LEFT JOIN FETCH st.year y
        JOIN FETCH c.subject s
        JOIN FETCH c.teacher t
        WHERE e.student.id = :studentId
        ORDER BY y.year ASC, e.enrolledAt ASC
        """)
    List<Enrollment> findByStudentIdWithCourseDetails(@Param("studentId") Long studentId);
 
    /** Total points earned by a student across all enrollments. */
    @Query("""
        SELECT COALESCE(SUM(e.pointsEarned), 0)
        FROM Enrollment e
        WHERE e.student.id = :studentId
        """)
    int sumPointsByStudentId(@Param("studentId") Long studentId);

    @Query("""
    SELECT COUNT(e) FROM Enrollment e
    WHERE e.student.id = :studentId
    AND e.progressPercent > 0
    """)
long countEnrollmentsWithAtLeastOneLesson(@Param("studentId") Long studentId);

long deleteByStudentId(Long studentId);
}
