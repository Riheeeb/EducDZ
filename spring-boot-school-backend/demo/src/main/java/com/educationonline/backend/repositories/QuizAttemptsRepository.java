package com.educationonline.backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.educationonline.backend.entities.QuizAttempts;
import com.educationonline.backend.entities.QuizAttempts.AttemptStatus;

public interface QuizAttemptsRepository extends JpaRepository<QuizAttempts, Long> {

    //all attempts by student for a specific quiz
    List<QuizAttempts> findByStudentIdAndQuizIdOrderByStartedAtDesc(Long studentId, Long quizId);

    /** Best attempt (highest score) by a student on a quiz. */
    @Query("""
        SELECT a FROM QuizAttempts a
        WHERE a.student.id = :studentId
        AND   a.quiz.id    = :quizId
        AND   a.status     = 'SUBMITTED'
        ORDER BY a.scorePercent DESC
        LIMIT 1
        """)
    Optional<QuizAttempts> findBestAttempt(
            @Param("studentId") Long studentId,
            @Param("quizId")    Long quizId);

            /** Check if student has an in-progress attempt on a quiz. */
    @Query("""
        SELECT COUNT(a) > 0 FROM QuizAttempts a
        WHERE a.student.id = :studentId
        AND   a.quiz.id    = :quizId
        AND   a.status     = 'IN_PROGRESS'
        """)
    boolean hasInProgressAttempt(
            @Param("studentId") Long studentId,
            @Param("quizId")    Long quizId);

            
            // all submitted attempts for a quiz, for student profile / history
 List<QuizAttempts> findByStudentIdAndStatus(Long studentId, QuizAttempts.AttemptStatus status);
 
    /** Check if student has completed a quiz (100% correct). */
    boolean existsByStudentIdAndQuizIdAndStatus(
            Long studentId, 
            Long quizId,
            QuizAttempts.AttemptStatus status);
    
    /** Get the most recent submitted attempt (for retry linking). */
    Optional<QuizAttempts> findFirstByStudentIdAndQuizIdAndStatusOrderBySubmittedAtDesc(
            Long studentId,
            Long quizId,
            QuizAttempts.AttemptStatus status);
            @Query("SELECT qa FROM QuizAttempts qa WHERE qa.student.id = :studentId AND qa.quiz.id = :quizId AND qa.status = 'IN_PROGRESS'")
Optional<QuizAttempts> findInProgressAttempt(
    @Param("studentId") Long studentId,
    @Param("quizId") Long quizId
);
Optional<QuizAttempts> findByStudentIdAndQuizIdAndStatus(
    Long studentId, 
    Long quizId, 
    AttemptStatus status
);

@Query("""
    SELECT COUNT(DISTINCT a.quiz.id) FROM QuizAttempts a
    LEFT JOIN a.quiz q
    LEFT JOIN q.course c
    LEFT JOIN q.lesson l
    LEFT JOIN l.courses lc
    WHERE a.student.id = :studentId
      AND (c.id = :courseId OR lc.id = :courseId)
      AND (a.status = 'COMPLETED' OR a.scorePercent >= COALESCE(q.passingScore, 60))
    """)
long countPassedQuizzesInCourse(@Param("studentId") Long studentId, @Param("courseId") Long courseId);


@Query("""
    SELECT COUNT(DISTINCT a.quiz.id)
    FROM QuizAttempts a
    WHERE a.student.id = :studentId
      AND a.scorePercent = 100
      AND a.startedAt = (
          SELECT MIN(a2.startedAt)
          FROM QuizAttempts a2
          WHERE a2.student.id = :studentId
            AND a2.quiz.id    = a.quiz.id
      )
""")
long countPerfectFirstAttempts(@Param("studentId") Long studentId);
 
/**
 * Counts attempts with a given student+quiz and any of the provided statuses.
 * Used by QuizService.submitAttempt() to detect whether this is a first attempt.
 *
 * Spring Data JPA derives this automatically — no @Query needed.
 */
long countByStudentIdAndQuizIdAndStatusIn(
        Long studentId,
        Long quizId,
        List<QuizAttempts.AttemptStatus> statuses);

List<QuizAttempts> findByStudentId(Long studentId);

@Modifying(clearAutomatically = true, flushAutomatically = true)
@Query("UPDATE QuizAttempts a SET a.previousAttempt = null WHERE a.student.id = :studentId")
int clearPreviousAttemptsForStudent(@Param("studentId") Long studentId);
 
        
} 
