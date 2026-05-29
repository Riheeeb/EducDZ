package com.educationonline.backend.services;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.educationonline.backend.dtos.badgesDTOS.BadgeAwardedDto;
import com.educationonline.backend.dtos.badgesDTOS.BadgeDTO;
import com.educationonline.backend.dtos.badgesDTOS.StudentBadgePageDTO;
import com.educationonline.backend.entities.Badges;
import com.educationonline.backend.entities.Badges.BadgeTier;
import com.educationonline.backend.entities.Badges.BadgeTrigger;
import com.educationonline.backend.entities.Courses;
import com.educationonline.backend.entities.Enrollment;
import com.educationonline.backend.entities.Points;
import com.educationonline.backend.entities.StudentBadge;
import com.educationonline.backend.entities.students;
import com.educationonline.backend.repositories.BadgeRepository;
import com.educationonline.backend.repositories.EnrollmentRepository;
import com.educationonline.backend.repositories.LessonRepository;
import com.educationonline.backend.repositories.PointRepository;
import com.educationonline.backend.repositories.ProgressRepository;
import com.educationonline.backend.repositories.QuizAttemptsRepository;
import com.educationonline.backend.repositories.StudentBadgeRepository;

import lombok.RequiredArgsConstructor;
import com.educationonline.backend.repositories.studentRepository;

import jakarta.transaction.Transactional;

@Service
@RequiredArgsConstructor
public class BadgeService {

    /*
     TRIGGERS — all handled here:
       onLessonCompleted()   → FIRST_LESSON
       onCourseCompleted()   → COURSE_COMPLETE, FAST_LEARNER, COURSE_MASTER
       onQuizSubmitted()     → QUIZ_PASS, QUIZ_PERFECT, QUIZ_MASTER
       onPointsUpdated()     → POINTS_MILESTONE
       onStreak()            → STREAK_7_DAYS
       onTopStudent()        → TOP_STUDENT
       onReEnroll()          → COMEBACK (30 days inactive), NEVER_GIVE_UP (3+ drops)
    */

    private final BadgeRepository            badgeRepository;
    private final StudentBadgeRepository     studentrBadgeRepository;
    private final studentRepository          studentRepository;
    private final EnrollmentRepository       enrollmentRepository;
    private final PointRepository            pointRepository;
    private final NotificationService        notificationService;
    private final LessonRepository           lessonRepository;
    private final ProgressRepository         progressRepository;
    private final QuizAttemptsRepository     quizAttemptsRepository;

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // ── LESSON ───────────────────────────────────────────────────────────────

    /**
     * Call after a student completes any lesson.
     * Checks: FIRST_LESSON
     */
    @Transactional
    public List<BadgeAwardedDto> onLessonCompleted(Long studentId, Long lessonId) {
        List<BadgeAwardedDto> awarded = new ArrayList<>();

        // FIRST_LESSON — only when this is the very first lesson completed by the student
        long totalCompleted = progressRepository.countByStudentIdAndCompletedTrue(studentId);
        if (totalCompleted == 1) {
            awardIfNotEarned(studentId, "FIRST_LESSON", null).ifPresent(awarded::add);
        }

        return awarded;
    }

    // ── COURSE ───────────────────────────────────────────────────────────────

    /**
     * Call after a student's course progress reaches 100%.
     * Checks: COURSE_COMPLETE, FAST_LEARNER, COURSE_MASTER
     */
    @Transactional
    public List<BadgeAwardedDto> onCourseCompleted(Long studentId, Long courseId, Object context) {
        List<BadgeAwardedDto> awarded = new ArrayList<>();

        // COURSE_COMPLETE — all lessons in this course are done
        long totalLessons     = lessonRepository.countByCoursesId(courseId);
        long completedLessons = progressRepository.countCompletedInCourse(studentId, courseId);

        if (totalLessons > 0 && completedLessons == totalLessons) {
            awardIfNotEarned(studentId, "COURSE_COMPLETE", courseId).ifPresent(awarded::add);
        }

        // FAST_LEARNER — completed within 3 days of enrolling
        Enrollment enrollment = enrollmentRepository
                .findByStudentIdAndCoursesId(studentId, courseId).orElse(null);

        if (enrollment != null
                && enrollment.getEnrolledAt() != null
                && enrollment.getCompletedAt() != null) {

            long days = java.time.temporal.ChronoUnit.DAYS.between(
                    enrollment.getEnrolledAt(), enrollment.getCompletedAt());

            if (days < 3) {
                awardIfNotEarned(studentId, "FAST_LEARNER", courseId).ifPresent(awarded::add);
            }
        }

        // COURSE_MASTER — student has now completed 10 or more different courses
        long completedCourseCount = enrollmentRepository
                .countByStudentIdAndStatus(studentId, Enrollment.EnrollmentStatus.COMPLETED);

        if (completedCourseCount >= 10) {
            awardIfNotEarned(studentId, "COURSE_MASTER", null).ifPresent(awarded::add);
        }

        return awarded;
    }

    // ── QUIZ ─────────────────────────────────────────────────────────────────

    /**
     * Call after every quiz submission.
     * Checks: QUIZ_PASS, QUIZ_PERFECT, QUIZ_MASTER
     *
     * @param isFirstAttempt true when no prior SUBMITTED/COMPLETED attempt existed
     *                       for this student+quiz before this submission.
     *                       Determined by QuizService before calling this method.
     */
    @Transactional
    public List<BadgeAwardedDto> onQuizSubmitted(
            Long studentId, int scorePercent, boolean passed, boolean isFirstAttempt) {

        List<BadgeAwardedDto> awarded = new ArrayList<>();

        // QUIZ_PASS — passed at least one quiz (score >= passingScore, any attempt)
        if (passed) {
            awardIfNotEarned(studentId, "QUIZ_PASS", null).ifPresent(awarded::add);
        }

        // QUIZ_PERFECT — 100% on the FIRST attempt of 5 different quizzes
        if (scorePercent == 100 && isFirstAttempt) {
            long perfectFirstAttempts = quizAttemptsRepository.countPerfectFirstAttempts(studentId);
            if (perfectFirstAttempts >= 5) {
                awardIfNotEarned(studentId, "QUIZ_PERFECT", null).ifPresent(awarded::add);
            }
        }

        // QUIZ_MASTER — 100% on the FIRST attempt of 10 different quizzes
        // Only possible when this submission is itself a perfect first attempt
        if (scorePercent == 100 && isFirstAttempt) {
            long perfectFirstAttempts = quizAttemptsRepository.countPerfectFirstAttempts(studentId);
            if (perfectFirstAttempts >= 10) {
                awardIfNotEarned(studentId, "QUIZ_MASTER", null).ifPresent(awarded::add);
            }
        }

        return awarded;
    }

    // ── POINTS MILESTONE ─────────────────────────────────────────────────────

    /**
     * Call whenever a student's total points change.
     * Checks: POINTS_MILESTONE (all thresholds <= current total)
     */
    @Transactional
    public List<BadgeAwardedDto> onPointsUpdated(Long studentId, int totalPoints) {
        List<BadgeAwardedDto> awarded = new ArrayList<>();

        List<Badges> milestoneBadges = badgeRepository
                .findByTriggerAndPointsThresholdLessThanEqualOrderByPointsThresholdAsc(
                        BadgeTrigger.POINTS_MILESTONE, totalPoints);

        for (Badges badge : milestoneBadges) {
            awardIfNotEarned(studentId, badge.getCode(), null).ifPresent(awarded::add);
        }

        return awarded;
    }

    // ── STREAK ───────────────────────────────────────────────────────────────

    /**
     * Call from the login / daily-activity endpoint once per calendar day.
     * Checks: STREAK_7_DAYS
     *
     * @param currentStreak the student's current consecutive-day streak (computed by caller)
     */
    @Transactional
    public List<BadgeAwardedDto> onStreak(Long studentId, int currentStreak) {
        List<BadgeAwardedDto> awarded = new ArrayList<>();

        if (currentStreak >= 7) {
            awardIfNotEarned(studentId, "STREAK_7_DAYS", null).ifPresent(awarded::add);
        }

        return awarded;
    }

    // ── TOP STUDENT ───────────────────────────────────────────────────────────

    /**
     * Call after recalculating course rankings (e.g. after a quiz or lesson completion).
     * Checks: TOP_STUDENT — student is currently ranked #1 in the course
     */
    @Transactional
    public List<BadgeAwardedDto> onTopStudent(Long studentId, Long courseId) {
        List<BadgeAwardedDto> awarded = new ArrayList<>();
        awardIfNotEarned(studentId, "TOP_STUDENT", courseId).ifPresent(awarded::add);
        return awarded;
    }

    // ── RE-ENROLL ─────────────────────────────────────────────────────────────

    /**
     * Call when a student re-enrolls in a course they had previously dropped.
     * Checks:
     *   COMEBACK      — last activity was more than 30 days ago
     *   NEVER_GIVE_UP — student has dropped and re-enrolled 3+ times
     */
    @Transactional
    public void onReEnroll(Long studentId, Long courseId) {
        Enrollment enrollment = enrollmentRepository
                .findByStudentIdAndCoursesId(studentId, courseId).orElse(null);

        if (enrollment == null) return;

        // COMEBACK — re-enrolling after 30 days of inactivity
        if (enrollment.getDroppedAt() != null) {
            long daysSinceDrop = java.time.temporal.ChronoUnit.DAYS.between(
                    enrollment.getDroppedAt(),
                    java.time.LocalDateTime.now());

            if (daysSinceDrop >= 30) {
                awardIfNotEarned(studentId, "COMEBACK", courseId);
            }
        }

        // NEVER_GIVE_UP — dropped and re-enrolled 3 or more times
        int dropCount = enrollment.getDropCount() != null ? enrollment.getDropCount() : 0;
        if (dropCount >= 3) {
            awardIfNotEarned(studentId, "NEVER_GIVE_UP", courseId);
        }
    }

    // ── CORE AWARD LOGIC ──────────────────────────────────────────────────────

    @Transactional
    public Optional<BadgeAwardedDto> awardIfNotEarned(
            Long studentId, String badgeCode, Long courseId) {

        // Already earned → skip (idempotent)
        if (studentrBadgeRepository.existsByStudentIdAndBadgeCode(studentId, badgeCode)) {
            return Optional.empty();
        }

        Optional<Badges> badgeOptional = badgeRepository.findByCode(badgeCode);
        if (badgeOptional.isEmpty()) {
            System.err.println("Badge config missing for code: " + badgeCode + " — skipping.");
            return Optional.empty();
        }
        Badges badge = badgeOptional.get();

        students user = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalStateException("Student not found: " + studentId));

        Courses course = null;
        if (courseId != null) {
            course = new Courses();
            course.setId(courseId);
        }

        // Persist the earned badge
        StudentBadge userBadge = StudentBadge.builder()
                .student(user)
                .badge(badge)
                .course(course)
                .bonusPointsAwarded(badge.getBonusPoints())
                .build();
        studentrBadgeRepository.save(userBadge);

        // Credit bonus points
        if (badge.getBonusPoints() > 0) {
            Points points = Points.builder()
                    .student(user)
                    .points(badge.getBonusPoints())
                    .reason(Points.Reason.BADGE_AWARDED)
                    .description("Badge earned: " + badge.getName())
                    .referenceId(badge.getId())
                    .build();
            pointRepository.save(points);
            user.setPoints(user.getPoints() + badge.getBonusPoints());
            studentRepository.save(user);
        }

        // Cascade — check if new total unlocks a POINTS_MILESTONE badge
        onPointsUpdated(studentId, user.getPoints());

        // Notify the student
        notificationService.notifyStudentBadgeEarned(
                studentId, badge.getName(), badge.getBonusPoints());

        return Optional.of(BadgeAwardedDto.builder()
                .badgeName(badge.getName())
                .badgeCode(badge.getCode())
                .tier(badge.getTier().name())
                .iconUrl(badge.getIconUrl())
                .bonusPointsAwarded(badge.getBonusPoints())
                .message("You earned the \"" + badge.getName()
                        + "\" badge! +" + badge.getBonusPoints() + " bonus points.")
                .build());
    }

    public long countPerfectFirstAttempts(Long studentId) {
        return quizAttemptsRepository.countPerfectFirstAttempts(studentId);
    }

    // ── PAGE & CATALOG ────────────────────────────────────────────────────────

    public StudentBadgePageDTO getStudentBadgePage(Long studentId) {
        students student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));

        List<StudentBadge> earned = studentrBadgeRepository.findByStudentId(studentId);
        Set<String> earnedCodes = earned.stream()
                .map(sb -> sb.getBadge().getCode())
                .collect(Collectors.toSet());

        List<BadgeDTO> earnedDTOs = earned.stream()
                .map(sb -> BadgeDTO.builder()
                        .id(sb.getBadge().getId())
                        .name(sb.getBadge().getName())
                        .description(sb.getBadge().getDescription())
                        .iconUrl(sb.getBadge().getIconUrl())
                        .tier(sb.getBadge().getTier().name())
                        .trigger(sb.getBadge().getTrigger().name())
                        .bonusPoints(sb.getBadge().getBonusPoints())
                        .earnedAt(sb.getEarnedAt() != null ? sb.getEarnedAt().toString() : null)
                        .earned(true)
                        .build())
                .collect(Collectors.toList());

        List<BadgeDTO> lockedDTOs = badgeRepository.findAll().stream()
                .filter(b -> !earnedCodes.contains(b.getCode()))
                .map(b -> BadgeDTO.builder()
                        .id(b.getId())
                        .code(b.getCode())
                        .name(b.getName())
                        .description(b.getDescription())
                        .iconUrl(b.getIconUrl())
                        .tier(b.getTier().name())
                        .bonusPoints(b.getBonusPoints())
                        .trigger(b.getTrigger().name())
                        .pointsThreshold(b.getPointsThreshold())
                        .earned(false)
                        .earnedAt(null)
                        .build())
                .toList();

        earnedDTOs.sort(Comparator.comparing(BadgeDTO::getEarnedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));

        int bonusTotal = earned.stream()
                .mapToInt(StudentBadge::getBonusPointsAwarded).sum();

        long bronze   = studentrBadgeRepository.countByStudentIdAndBadgeTier(studentId, BadgeTier.BRONZE);
        long silver   = studentrBadgeRepository.countByStudentIdAndBadgeTier(studentId, BadgeTier.SILVER);
        long gold     = studentrBadgeRepository.countByStudentIdAndBadgeTier(studentId, BadgeTier.GOLD);
        long platinum = studentrBadgeRepository.countByStudentIdAndBadgeTier(studentId, BadgeTier.PLATINUM);

        return StudentBadgePageDTO.builder()
                .totalEarned(earnedDTOs.size())
                .bronzeCount((int) bronze)
                .silverCount((int) silver)
                .goldCount((int) gold)
                .platinumCount((int) platinum)
                .totalBonusPointsFromBadges(bonusTotal)
                .totalPoints(student.getPoints())
                .earnedBadges(earnedDTOs)
                .lockedBadges(lockedDTOs)
                .build();
    }

    public List<BadgeDTO> getAllBadges(Long studentId) {
        List<Badges> allBadges = badgeRepository.findAll();
        List<StudentBadge> studentBadges = studentrBadgeRepository.findByStudentId(studentId);

        Map<Long, StudentBadge> earnedMap = studentBadges.stream()
                .collect(Collectors.toMap(sb -> sb.getBadge().getId(), sb -> sb));

        return allBadges.stream().map(badge -> {
            StudentBadge sb = earnedMap.get(badge.getId());
            boolean earned  = sb != null;
            return BadgeDTO.builder()
                    .id(badge.getId())
                    .code(badge.getCode())
                    .name(badge.getName())
                    .description(badge.getDescription())
                    .iconUrl(badge.getIconUrl())
                    .tier(badge.getTier().name())
                    .bonusPoints(badge.getBonusPoints())
                    .trigger(badge.getTrigger().name())
                    .pointsThreshold(badge.getPointsThreshold())
                    .earned(earned)
                    .earnedAt(earned ? sb.getEarnedAt().toString() : null)
                    .build();
        }).toList();
    }
}