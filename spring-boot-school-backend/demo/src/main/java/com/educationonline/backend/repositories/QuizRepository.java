package com.educationonline.backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.educationonline.backend.entities.Quiz;
import com.educationonline.backend.entities.QuizAttempts;
import com.educationonline.backend.entities.QuizAttempts.AttemptStatus;

public interface QuizRepository extends JpaRepository<Quiz, Long> {

    // Find all quizzes for a given lesson LESSON_QUIZES TYPE
    Optional<Quiz> findByLessonId(Long lessonId);

    //Course quizzes COURSE_QUIZES TYPE
    List<Quiz> findByCourseId(Long courseId);

    // give all quizes of specific course and all quizes of lessons of this course ORDER BY createdAt ASC
    @Query("""
        SELECT DISTINCT q FROM Quiz q
        LEFT JOIN q.course c
        LEFT JOIN q.lesson l
        LEFT JOIN l.courses lc
        WHERE c.id = :courseId
           OR lc.id = :courseId
        ORDER BY q.createdAt ASC
        """)
    List<Quiz> findAllByCourseIdIncludingLessonQuizzes(@Param("courseId") Long courseId);

    @Query("""
        SELECT COUNT(DISTINCT q) FROM Quiz q
        LEFT JOIN q.course c
        LEFT JOIN q.lesson l
        LEFT JOIN l.courses lc
        WHERE c.id = :courseId
           OR lc.id = :courseId
        """)
    long countAllByCourseIdIncludingLessonQuizzes(@Param("courseId") Long courseId);

    @Query("SELECT DISTINCT q FROM Quiz q " +
       "LEFT JOIN q.course c " +        
       "LEFT JOIN q.lesson l " +          
       "LEFT JOIN l.courses lc " +       
       "WHERE c.teacher.id = :teacherId " +
       "OR lc.teacher.id = :teacherId " +
       "OR q.teacher.id = :teacherId " + // ← also check direct teacher field
       "ORDER BY q.createdAt DESC")
List<Quiz> findByTeacherId(@Param("teacherId") Long teacherId);
   // QuizRepository.java — replace findAllByTeacherId
@Query("SELECT q FROM Quiz q LEFT JOIN FETCH q.questions WHERE q.teacher.id = :teacherId ORDER BY q.createdAt DESC")
List<Quiz> findAllByTeacherId(@Param("teacherId") Long teacherId);

    @Query("SELECT DISTINCT q FROM Quiz q LEFT JOIN FETCH q.questions WHERE q.teacher.id = :teacherId ORDER BY q.createdAt DESC")
    List<Quiz> findAllByTeacherIdWithQuestions(@Param("teacherId") Long teacherId);

    List<Quiz> findByTeacherIdAndCourseIsNullAndLessonIsNull(Long teacherId);

    
}
