package com.educationonline.backend.services;

import java.util.Map;

import org.springframework.stereotype.Service;

import com.educationonline.backend.entities.BadgeEventType;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BadgeEngineService {

    private final BadgeService badgeService;

    /**
     * Central dispatcher — called by any service after a significant event.
     *
     * Required context keys per event:
     *
     *  LESSON_COMPLETED  → lessonId (Long)
     *  COURSE_COMPLETED  → courseId (Long)
     *  QUIZ_SUBMITTED    → score (int), passed (boolean), isFirstAttempt (boolean)
     *  POINTS_UPDATED    → totalPoints (int)
     *  STREAK            → currentStreak (int)   ← new
     *  TOP_STUDENT       → courseId (Long)        ← new
     *  LOGIN             → courseId (Long)  [re-enroll trigger]
     */
    public void handleEvent(Long studentId, BadgeEventType event, Map<String, Object> context) {

        switch (event) {

            case LESSON_COMPLETED ->
                badgeService.onLessonCompleted(
                        studentId,
                        (Long) context.get("lessonId"));

            case COURSE_COMPLETED ->
                badgeService.onCourseCompleted(
                        studentId,
                        (Long) context.get("courseId"),
                        context);

            case QUIZ_SUBMITTED ->
                // isFirstAttempt defaults to false when not provided (legacy submitQuiz path)
                badgeService.onQuizSubmitted(
                        studentId,
                        (int)     context.get("score"),
                        (boolean) context.get("passed"),
                        context.getOrDefault("isFirstAttempt", false) instanceof Boolean b && b);

            case POINTS_UPDATED ->
                badgeService.onPointsUpdated(
                        studentId,
                        (int) context.get("totalPoints"));

            // STREAK_7_DAYS — call from your login / daily-activity endpoint.
            // Pass currentStreak = the number of consecutive days the student
            // has been active (computed by your streak-tracking logic).
            case STREAK ->
                badgeService.onStreak(
                        studentId,
                        (int) context.get("currentStreak"));

            // TOP_STUDENT — call after recalculating course leaderboard.
            case TOP_STUDENT ->
                badgeService.onTopStudent(
                        studentId,
                        (Long) context.get("courseId"));

            // LOGIN / re-enroll — call when student re-enrolls in a dropped course.
            case LOGIN ->
                badgeService.onReEnroll(
                        studentId,
                        (Long) context.get("courseId"));
        }
    }
}