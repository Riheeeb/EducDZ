package com.educationonline.backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.educationonline.backend.entities.Lessons;

public interface LessonRepository extends JpaRepository<Lessons, Long> {

    Long countByCoursesId(Long courseId);

    @Query("""
            SELECT DISTINCT l FROM Lessons l
            LEFT JOIN FETCH l.courses c
            LEFT JOIN FETCH c.teacher t
            LEFT JOIN FETCH t.userT u
            LEFT JOIN FETCH l.teacher directTeacher
            LEFT JOIN FETCH directTeacher.userT directUser
            LEFT JOIN FETCH l.resource r
            WHERE (c IS NULL OR c.published = true)
            AND (LOWER(l.title) LIKE LOWER(CONCAT('%', :q, '%'))
                 OR (l.content IS NOT NULL AND LOWER(l.content) LIKE LOWER(CONCAT('%', :q, '%'))))
            ORDER BY l.title
            """)
    List<Lessons> searchPublishedLessonsByTitleOrContent(@Param("q") String q);

    Optional<Lessons> findTopByCoursesIdOrderByOrderNumberDesc(Long courseId);

    List<Lessons> findByCoursesIdOrderByOrderNumberAsc(Long courseId);

@Query("""
    SELECT DISTINCT l FROM Lessons l 
    LEFT JOIN FETCH l.courses c 
    LEFT JOIN FETCH c.teacher t
    LEFT JOIN FETCH t.userT
    WHERE c.id IN (
        SELECT e.courses.id 
        FROM Enrollment e 
        WHERE e.student.id = :studentId
    )
    AND c.published = true
    ORDER BY l.orderNumber ASC
    """)
List<Lessons> findAllAccessibleLessonsOrdered(@Param("studentId") Long studentId);
    
void deleteById(Long id);

    List<Lessons> findByCoursesId(Long courseId);

    Optional<Lessons> findByIdAndCoursesId(Long lessonId, Long courseId);

Optional<Lessons> findByCoursesIdAndOrderNumber(Long courseId, Integer orderNumber);

    @Query("""
SELECT COUNT(l)
FROM Lessons l
JOIN l.courses c
JOIN Enrollment e ON e.courses.id = c.id
WHERE e.student.id = :studentId
""")
Long countLessonsByStudentCourses(Long studentId);

@Query("""
SELECT COUNT(l)
FROM Lessons l
WHERE 
    l.courses IS NULL
    OR l.courses.id IN (
        SELECT e.courses.id
        FROM Enrollment e
        WHERE e.student.id = :studentId
    )
""")
Long countAllAccessibleLessons(@Param("studentId") Long studentId);


// finds all lessons belonging to courses of this teacher
// in LessonRepository
// LessonRepository.java
@Query("SELECT l FROM Lessons l WHERE l.teacher.id = :teacherId")
List<Lessons> findDirectLessonsByTeacherId(@Param("teacherId") Long teacherId);

List<Lessons> findByTeacherIdAndCoursesIsNull(Long teacherId);

@Query("SELECT l FROM Lessons l INNER JOIN l.courses c WHERE c.teacher.id = :teacherId")
List<Lessons> findCourseLessonsByTeacherId(@Param("teacherId") Long teacherId);

@Query("""
SELECT COUNT(DISTINCT l)
FROM Lessons l
LEFT JOIN l.courses c
WHERE l.teacher.id = :teacherId OR c.teacher.id = :teacherId
""")
long countByTeacherId(@Param("teacherId") Long teacherId);


}
