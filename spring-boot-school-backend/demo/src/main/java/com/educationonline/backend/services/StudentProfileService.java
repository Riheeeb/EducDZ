package com.educationonline.backend.services;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.educationonline.backend.dtos.profiles.EnrolledCourseCardDto;
import com.educationonline.backend.dtos.profiles.StudentProfileDto;
import com.educationonline.backend.dtos.profiles.YearCardDto;
import com.educationonline.backend.entities.Courses;
import com.educationonline.backend.entities.Enrollment;
import com.educationonline.backend.entities.Enrollment.EnrollmentStatus;
import com.educationonline.backend.entities.Streams;
import com.educationonline.backend.entities.StudentBadge;
import com.educationonline.backend.entities.StudentLevel;
import com.educationonline.backend.entities.StudyLevel;
import com.educationonline.backend.entities.Years;
import com.educationonline.backend.entities.Years.yearValue;
import com.educationonline.backend.entities.students;
import com.educationonline.backend.entities.substream;
import com.educationonline.backend.repositories.EnrollmentRepository;
import com.educationonline.backend.repositories.ProgressRepository;
import com.educationonline.backend.repositories.StudentBadgeRepository;
import com.educationonline.backend.repositories.studentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StudentProfileService {

    private final EnrollmentRepository enrollmentRepository;
    private final studentRepository studentRepository;
    private final ProgressRepository progressRepository;
    private final StudentBadgeRepository studentBadgeRepository;

    @Transactional(readOnly = true)
    public StudentProfileDto getStudentProfile(Long studentId) {
        students student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalStateException("Student not found"));
        List<Enrollment> allEnrollments = enrollmentRepository.findByStudentIdWithCourseDetails(studentId);
        List<StudentBadge> allBadges = studentBadgeRepository.findByStudentId(studentId);

        int totalPoints = student.getPoints();
        int totalCompleted = (int) allEnrollments.stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.COMPLETED)
                .count();
        int totalActive = (int) allEnrollments.stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.ACTIVE)
                .count();

        StudyLevel studyLevel = calculateStudyLevel(totalPoints, totalCompleted);
        String studyLevelLabel = buildStudyLevelLabel(studyLevel);
        int pointsToNext = pointsToNextLevel(studyLevel, totalPoints);
        String currentYear = currentYearLabel(student, allEnrollments);
        List<YearCardDto> yearHistory = buildYearHistory(
                student, allEnrollments, currentYear, studentId, allBadges, currentYear);

        int totalBadges = studentBadgeRepository.countByStudentId(studentId);

        return new StudentProfileDto(
                studentId,
                student.getUserS() != null ? student.getUserS().getName() : "Student",
                student.getUserS() != null ? student.getUserS().getEmail() : "",
                currentYear,
                studyLevel,
                studyLevelLabel,
                totalPoints,
                allEnrollments.size(),
                totalCompleted,
                totalActive,
                pointsToNext,
                totalBadges,
                yearHistory,
                student.getStudentLevel(),
                student.getStreams() != null ? student.getStreams().getId() : null,
                student.getStreams() != null && student.getStreams().getYear() != null
                        ? student.getStreams().getYear().getId()
                        : null,
                student.getSubstream() != null ? student.getSubstream().getId() : null);
    }

    private String currentYearLabel(students student, List<Enrollment> enrollments) {
        if (student.getStreams() != null && student.getStreams().getYear() != null) {
            return student.getStreams().getYear().getLabel();
        }

        return enrollments.stream()
                .max(Comparator.comparing(
                        Enrollment::getEnrolledAt,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .map(Enrollment::getCourses)
                .map(Courses::getStream)
                .map(Streams::getYear)
                .map(Years::getLabel)
                .orElseGet(() -> enrollments.stream()
                        .map(Enrollment::getCourses)
                        .filter(Objects::nonNull)
                        .map(Courses::getYear)
                        .filter(Objects::nonNull)
                        .map(yearValue::getValue)
                        .findFirst()
                        .orElse(null));
    }

    private StudyLevel calculateStudyLevel(int points, int completedCourses) {
        if (points >= 1000 && completedCourses >= 20)
            return StudyLevel.MASTER;
        if (points >= 500 && completedCourses >= 12)
            return StudyLevel.ADVANCED;
        if (points >= 200 && completedCourses >= 6)
            return StudyLevel.INTERMEDIATE;
        if (points >= 100 && completedCourses >= 3)
            return StudyLevel.ELEMENTARY;
        return StudyLevel.BEGINNER;
    }

    private String buildStudyLevelLabel(StudyLevel level) {
        return switch (level) {
            case BEGINNER -> "Beginner Learner";
            case ELEMENTARY -> "Elementary Learner";
            case INTERMEDIATE -> "Intermediate Learner";
            case ADVANCED -> "Advanced Learner";
            case MASTER -> "Master Learner";
        };
    }

    private int pointsToNextLevel(StudyLevel current, int currentPoints) {
        return switch (current) {
            case BEGINNER -> Math.max(200 - currentPoints, 0);
            case ELEMENTARY -> Math.max(500 - currentPoints, 0);
            case INTERMEDIATE -> Math.max(1000 - currentPoints, 0);
            case ADVANCED -> Math.max(2000 - currentPoints, 0);
            case MASTER -> 0;
        };
    }

    private List<YearCardDto> buildYearHistory(
            students student,
            List<Enrollment> allEnrollments,
            String currentYear,
            Long studentId,
            List<StudentBadge> allBadges,
            String profileCurrentYearLabel) {
        Map<String, List<Enrollment>> enrollmentsByYear = new HashMap<>();
        for (Enrollment e : allEnrollments) {
            if (e.getCourses() == null) {
                continue;
            }
            String yl = yearLabelFromCourse(e.getCourses());
            if (yl == null) {
                continue;
            }
            enrollmentsByYear.computeIfAbsent(yl, k -> new ArrayList<>()).add(e);
        }

        List<String> labels = schoolYearSequence().stream().map(yearValue::getValue).toList();
        int currentIndex = labels.indexOf(currentYear);

        return labels.stream()
                .filter(label -> {
                    boolean hasEnrollment = enrollmentsByYear.containsKey(label);
                    boolean isCurrent = Objects.equals(label, currentYear);
                    boolean isPastOrCurrent = currentIndex < 0 || labels.indexOf(label) <= currentIndex;
                    return (hasEnrollment || isCurrent) && isPastOrCurrent;
                })
                .map(label -> yearCardFor(
                        label,
                        enrollmentsByYear.getOrDefault(label, List.of()),
                        student,
                        studentId,
                        allBadges,
                        profileCurrentYearLabel))
                .toList();
    }

    /** Academic year label: from stream’s year when present, else from course.year enum. */
    private String yearLabelFromCourse(Courses c) {
        if (c == null) {
            return null;
        }
        if (c.getStream() != null && c.getStream().getYear() != null) {
            return c.getStream().getYear().getLabel();
        }
        if (c.getYear() != null) {
            return c.getYear().getValue();
        }
        return null;
    }

    private YearCardDto yearCardFor(String yearLabel, List<Enrollment> enrollments, students student,
            Long studentId, List<StudentBadge> allBadges, String profileCurrentYearLabel) {
        Enrollment firstEnrollment = enrollments.stream().findFirst().orElse(null);
        Courses course = firstEnrollment != null ? firstEnrollment.getCourses() : null;
        Streams stream = course != null ? course.getStream() : student.getStreams();
        substream sub = course != null && course.getSubstream() != null ? course.getSubstream()
                : student.getSubstream();
        StudentLevel level = course != null && course.getStudentLevel() != null
                ? course.getStudentLevel()
                : student.getStudentLevel();

        int lessonsCompleted = 0;
        for (Enrollment e : enrollments) {
            if (e.getCourses() == null || e.getCourses().getId() == null) {
                continue;
            }
            lessonsCompleted += (int) progressRepository.countCompletedInCourse(studentId, e.getCourses().getId());
        }

        int badgesEarned = (int) allBadges.stream()
                .filter(sb -> badgeCountsForYear(sb, yearLabel, profileCurrentYearLabel))
                .count();

        return YearCardDto.builder()
                .yearLabel(yearLabel)
                .studentLevel(level != null ? level.name() : null)
                .academicPeriod(yearLabel)
                .stream(streamLabel(stream))
                .substream(sub != null ? sub.getNameSubstream() : null)
                .totalEnrolledCourses(enrollments.size())
                .totalCompletedCourses((int) enrollments.stream()
                        .filter(enrollment -> enrollment.getStatus() == EnrollmentStatus.COMPLETED)
                        .count())
                .lessonsCompleted(lessonsCompleted)
                .pointsEarned(enrollments.stream().mapToInt(Enrollment::getPointsEarned).sum())
                .badgesEarned(badgesEarned)
                .courses(enrollments.stream().map(this::toCourseCard).toList())
                .build();
    }

    private boolean badgeCountsForYear(StudentBadge sb, String yearLabel, String profileCurrentYearLabel) {
        if (sb.getCourse() != null && sb.getCourse().getId() != null) {
            String yl = yearLabelFromCourse(sb.getCourse());
            return yl != null && yl.equals(yearLabel);
        }
        return profileCurrentYearLabel != null && profileCurrentYearLabel.equals(yearLabel);
    }

    private EnrolledCourseCardDto toCourseCard(Enrollment enrollment) {
        Courses course = enrollment.getCourses();
        String teacherName = "";
        if (course != null && course.getTeacher() != null && course.getTeacher().getUserT() != null) {
            teacherName = course.getTeacher().getUserT().getName();
        }

        return EnrolledCourseCardDto.builder()
                .courseId(course != null ? course.getId() : null)
                .courseTitle(course != null ? course.getTitle() : "Course")
                .courseDescription(course != null ? course.getDescription() : "")
                .teacherName(teacherName)
                .enrollmentDate(enrollment.getEnrolledAt() != null ? enrollment.getEnrolledAt().toString() : "")
                .completionDate(enrollment.getCompletedAt() != null ? enrollment.getCompletedAt().toString() : "")
                .status(enrollment.getStatus() != null ? enrollment.getStatus().name() : "")
                .progressPercent(enrollment.getProgressPercent() != null ? enrollment.getProgressPercent() : 0)
                .pointsEarned(enrollment.getPointsEarned())
                .build();
    }

    private String streamLabel(Streams stream) {
        if (stream == null || stream.getStreamType() == null) {
            return null;
        }
        return stream.getStreamType().getNamestream();
    }

    private List<yearValue> schoolYearSequence() {
        return List.of(
                yearValue.Y1_AM,
                yearValue.Y2_AM,
                yearValue.Y3_AM,
                yearValue.Y4_AM,
                yearValue.Y1_AS,
                yearValue.Y2_AS,
                yearValue.Y3_AS);
    }
}
