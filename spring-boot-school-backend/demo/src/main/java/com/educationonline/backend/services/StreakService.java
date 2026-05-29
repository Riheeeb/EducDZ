package com.educationonline.backend.services;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.educationonline.backend.repositories.ProgressRepository;

import lombok.RequiredArgsConstructor;

/**
 * Awards {@code SEVEN_DAY_STREAK} when the learner completes at least one lesson
 * on seven consecutive calendar days (ending today or the last active day).
 */
@Service
@RequiredArgsConstructor
public class StreakService {

    private final ProgressRepository progressRepository;
    private final BadgeService badgeService;

    public void checkAfterLessonActivity(Long studentId) {
        int streak = computeStreak(studentId);
        if (streak >= 7) {
            badgeService.awardIfNotEarned(studentId, "STREAK_7_DAYS", null);
        }
    }

    public int getCurrentStreak(Long studentId) {
        return computeStreak(studentId);
    }

    private int computeStreak(Long studentId) {
        List<LocalDateTime> times = progressRepository.findCompletionTimesForStudent(studentId);
        if (times.isEmpty()) {
            return 0;
        }
        Set<LocalDate> days = new HashSet<>();
        for (LocalDateTime t : times) {
            if (t != null) {
                days.add(t.toLocalDate());
            }
        }
        int streak = 0;
        LocalDate cursor = LocalDate.now();
        if (!days.contains(cursor) && days.contains(cursor.minusDays(1))) {
            cursor = cursor.minusDays(1);
        }
        while (days.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }
}
