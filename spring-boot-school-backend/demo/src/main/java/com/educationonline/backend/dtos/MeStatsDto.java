package com.educationonline.backend.dtos;

/**
 * Dashboard stats for the current student (GET /api/me/stats).
 */
public record MeStatsDto(
        long lessonsCompleted,
        long enrolledCourses,
        int points) {
}
