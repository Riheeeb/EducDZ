package com.educationonline.backend.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.educationonline.backend.dtos.MeStatsDto;
import com.educationonline.backend.dtos.StudentProgressDto;
import com.educationonline.backend.entities.BadgeEventType;
import com.educationonline.backend.entities.Enrollment;
import com.educationonline.backend.entities.Lessons;
import com.educationonline.backend.entities.Progress;
import com.educationonline.backend.entities.students;
import com.educationonline.backend.repositories.EnrollmentRepository;
import com.educationonline.backend.repositories.LessonRepository;
import com.educationonline.backend.repositories.ProgressRepository;
import com.educationonline.backend.repositories.QuizAttemptsRepository;
import com.educationonline.backend.repositories.QuizRepository;
import com.educationonline.backend.repositories.studentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final BadgeService badgeService;
    private final ProgressRepository progressRepository;
    private final LessonRepository lessonRepository;
    private final studentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final BadgeEngineService badgeEngine;
    private final QuizRepository quizRepository;
    private final QuizAttemptsRepository quizAttemptsRepository;
    private final StreakService streakService;

   

   @Transactional
public void markLessonCompleted(Long studentId, Long lessonId) {

    students student = studentRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found"));

    Lessons lesson = lessonRepository.findById(lessonId)
            .orElseThrow(() -> new RuntimeException("Lesson not found"));

    boolean already = progressRepository
            .existsByStudent_IdAndLesson_Id(studentId, lessonId);

    if (already) {
        return; // idempotent
    }

    Progress progress = new Progress();
    progress.setStudent(student);
    progress.setLesson(lesson);
    progress.setCompleted(true);
    progress.setCompletedAt(LocalDateTime.now());

    progressRepository.save(progress);

    if (lesson.getCourses() != null) {
        Long courseId = lesson.getCourses().getId();
        enrollmentRepository.findByStudentIdAndCoursesId(studentId, courseId).ifPresent(enrollment -> {
            int percent = calculateCourseProgressPercent(studentId, courseId);
            enrollment.setProgressPercent(percent);
            enrollment.setLastAccessedAt(LocalDateTime.now());
            if (percent >= 100) {
                enrollment.setStatus(Enrollment.EnrollmentStatus.COMPLETED);
                enrollment.setCompletedAt(LocalDateTime.now());
            }
            enrollmentRepository.save(enrollment);
        });
    }

    student.setPoints(student.getPoints() + 10);

    badgeEngine.handleEvent(
    studentId,
    BadgeEventType.POINTS_UPDATED,
    Map.of("totalPoints", student.getPoints())
);
    long totalCompleted = progressRepository
            .countByStudentIdAndCompletedTrue(studentId);

    badgeEngine.handleEvent(
            studentId,
            BadgeEventType.LESSON_COMPLETED,
            Map.of(
                    "lessonId", lessonId,
                    "totalCompleted", totalCompleted,
                    "first", totalCompleted == 1
            )
    );

    studentRepository.save(student);
    streakService.checkAfterLessonActivity(studentId);
}

public long countCompletedLessons(Long studentId) {
    return progressRepository.countByStudentIdAndCompletedTrue(studentId);
}
    

    public StudentProgressDto getCourseProgress(Long studentId, Long courseId) {
        studentRepository.findById(studentId).orElseThrow();
        enrollmentRepository.findByStudentIdAndCoursesId(studentId, courseId)
                .orElseThrow(() -> new IllegalStateException("Student must be enrolled in this course."));
        return new StudentProgressDto(studentId, courseId, calculateCourseProgressPercent(studentId, courseId));
    }

    public double getStudentGlobalProgress(Long studentId) {
        studentRepository.findById(studentId).orElseThrow();
        Long totalLessons = lessonRepository.countAllAccessibleLessons(studentId);
        if (totalLessons == null || totalLessons == 0) {
            return 0.0;
        }
        long completedLessons = progressRepository.countByStudentIdAndCompletedTrue(studentId);
        return (completedLessons * 100.0) / totalLessons;
    }

    public Lessons getContinueLearningLesson(Long studentId, Long courseId) {
        studentRepository.findById(studentId).orElseThrow();

        List<Lessons> lessons;
        if (courseId != null) {
            lessons = lessonRepository.findByCoursesIdOrderByOrderNumberAsc(courseId);
        } else {
            lessons = lessonRepository.findAllAccessibleLessonsOrdered(studentId);
        }

        for (Lessons lesson : lessons) {
            if (lesson.getCourses() == null) {
                continue;
            }
            if (!lessonHasVideo(lesson)) {
                continue;
            }
            boolean completed = progressRepository.existsByStudent_IdAndLesson_IdAndCompletedTrue(studentId, lesson.getId());
            if (!completed) {
                return lesson;
            }
        }
        return null;
    }

    private boolean lessonHasVideo(Lessons lesson) {
        var res = lesson.getResource();
        if (res == null) {
            return false;
        }
        return res.getVideoUrl() != null && !res.getVideoUrl().isBlank();
    }

    @Transactional
    public void touchCourse(Long studentId, Long courseId) {
        enrollmentRepository.findByStudentIdAndCoursesId(studentId, courseId).ifPresent(enrollment -> {
            enrollment.setLastAccessedAt(LocalDateTime.now());
            enrollmentRepository.save(enrollment);
        });
    }

    @Transactional
    public void refreshCourseProgress(Long studentId, Long courseId) {
        enrollmentRepository.findByStudentIdAndCoursesId(studentId, courseId).ifPresent(enrollment -> {
            int percent = calculateCourseProgressPercent(studentId, courseId);
            enrollment.setProgressPercent(percent);
            enrollment.setLastAccessedAt(LocalDateTime.now());
            if (percent >= 100) {
                enrollment.setStatus(Enrollment.EnrollmentStatus.COMPLETED);
                if (enrollment.getCompletedAt() == null) {
                    enrollment.setCompletedAt(LocalDateTime.now());
                }
            }
            enrollmentRepository.save(enrollment);
        });
    }

    private int calculateCourseProgressPercent(Long studentId, Long courseId) {
        long totalLessons = lessonRepository.countByCoursesId(courseId);
        long totalQuizzes = quizRepository.countAllByCourseIdIncludingLessonQuizzes(courseId);
        long totalItems = totalLessons + totalQuizzes;
        if (totalItems == 0) {
            return 0;
        }

        long completedLessons = progressRepository.countCompletedInCourse(studentId, courseId);
        long passedQuizzes = quizAttemptsRepository.countPassedQuizzesInCourse(studentId, courseId);
        return (int) Math.round(((completedLessons + passedQuizzes) * 100.0) / totalItems);
    }

    public MeStatsDto getMeStats(Long studentId) {
        students s = studentRepository.findById(studentId).orElseThrow();
        long lessonsCompleted = progressRepository.countByStudentIdAndCompletedTrue(studentId);
        long enrolledCourses = enrollmentRepository.countByStudentId(studentId);
        return new MeStatsDto(lessonsCompleted, enrolledCourses, s.getPoints());
    }

}
