package com.educationonline.backend.repositories;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.educationonline.backend.entities.Courses;
import com.educationonline.backend.entities.StudentLevel;
import com.educationonline.backend.entities.Years;

public interface CourseRepository extends JpaRepository<Courses, Long>, JpaSpecificationExecutor<Courses> {

    List<Courses> findByTeacherId(Long teacherId);
    
    Courses findByPublishedTrueAndId(Long courseId);

    List<Courses> findByPublishedTrueAndStreamId(Long streamId);

    List<Courses> findByPublishedTrueAndSubjectId(Long subjectId);

long countByTeacherId(Long teacherId);

// what students see: only published courses
long countByTeacherIdAndPublishedTrue(Long teacherId);

// count published courses in a specific stream
long countByStreamIdAndPublishedTrue(Long streamId);

long countByPublishedTrue();

 Page<Courses> findByTeacherIdAndPublishedTrue(Long teacherId, Pageable pageable);

 Page<Courses> findByPublishedTrue(Pageable pageable);

 // POPULAR COURSES - global published courses ordered by enrollment count
@Query("""
SELECT c FROM Courses c
WHERE c.published = true
ORDER BY SIZE(c.enrollments) DESC
""")
Page<Courses> findPopularCourses(Pageable pageable);
            
 // RECOMMENDED COURSES - personalized to the student's academic profile
@Query("""
SELECT c FROM Courses c
JOIN c.stream.year y
WHERE c.published = true
AND c.studentLevel = :studentLevel
AND c.stream.id = :streamId
AND y.id = :yearId
AND (:substreamId IS NULL OR c.substream.id = :substreamId)
AND c.id NOT IN (SELECT e.courses.id FROM Enrollment e WHERE e.student.id = :studentId)
ORDER BY SIZE(c.enrollments) DESC
        """)
Page<Courses> findRecomendedCourses(
        @Param("studentLevel") StudentLevel studentLevel,
        @Param("streamId") Long streamId,
        @Param("yearId") Long yearId,
        @Param("substreamId") Long substreamId,
        @Param("studentId") Long studentId,
        Pageable pageable
);

// RECOMMENDED COURSES for middle school (no stream — match by year enum directly)
@Query("""
SELECT c FROM Courses c
WHERE c.published = true
AND c.studentLevel = :studentLevel
AND c.year = :year
AND c.stream IS NULL
AND (:substreamId IS NULL OR c.substream.id = :substreamId)
AND c.id NOT IN (SELECT e.courses.id FROM Enrollment e WHERE e.student.id = :studentId)
ORDER BY SIZE(c.enrollments) DESC
""")
Page<Courses> findRecomendedCoursesMiddleSchool(
        @Param("studentLevel") StudentLevel studentLevel,
        @Param("year") Years.yearValue year,
        @Param("substreamId") Long substreamId,
        @Param("studentId") Long studentId,
        Pageable pageable
);

// LATEST COURSES - published courses created in the last 5 days (new additions)
@Query("""
SELECT c FROM Courses c
WHERE c.published = true
AND c.createdAt >= :since
ORDER BY c.createdAt DESC
        """)
Page<Courses> findLatestCoursesSince(@Param("since") java.time.LocalDateTime since, Pageable pageable);

//WHEN STUDENT HAS NO ENROLLMENT YET
@Query("""
SELECT c FROM Courses c
WHERE c.published = true
ORDER BY SIZE(c.enrollments) DESC
        """)
Page<Courses> findPopularCoursesForNewStudent(Pageable pageable);
@Query("""
SELECT c FROM Courses c
WHERE c.published = true
ORDER BY c.createdAt DESC
        """)
Page<Courses> findLatestCoursesForNewStudent(Pageable pageable);

    @Query("""
            SELECT DISTINCT c FROM Courses c
            LEFT JOIN FETCH c.lesson l
            LEFT JOIN FETCH l.resource
            WHERE c.teacher.id = :teacherId AND c.published = true
            """)
    List<Courses> findPublishedByTeacherIdWithLessonsAndResources(@Param("teacherId") Long teacherId);

    @Query("""
            SELECT DISTINCT c FROM Courses c
            JOIN FETCH c.teacher t
            JOIN FETCH t.userT u
            WHERE c.published = true
            AND (LOWER(c.title) LIKE LOWER(CONCAT('%', :q, '%'))
                 OR (c.description IS NOT NULL AND LOWER(c.description) LIKE LOWER(CONCAT('%', :q, '%'))))
            ORDER BY c.title
            """)
    List<Courses> searchPublishedByTitleOrDescription(@Param("q") String q);

}
