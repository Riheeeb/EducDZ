package com.educationonline.backend.dtos;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourseDto {

    private Long id;
    private String title;
    private String description;
    private Boolean published;
    private String createdAt;

    // level
    private String studentLevel;          // "MIDDLE_SCHOOL" | "HIGH_SCHOOL"

    // foreign key IDs — used when sending data TO backend
    private Long yearId;
    private Long streamId;
    private Long substreamId;
    private Long subjectId;
    private Long teacherId;

    // display names — used when receiving data FROM backend
    private String yearName;              // "1AS", "2AM" etc
    private String streamName;            // "Science Experimentale" etc
    private String substreamName;         // "Genie Civil" etc
    private String subjectName;

    // nested teacher info
    private TeacherSummaryDto teacher;

    // lessons
    private List<LessonDto> lessons;
    private Long lessonsCount;
    private Long quizzesCount;
    private Long enrolledCount;

    // ── inner DTOs ──────────────────────────────────────────────────

    @Data
    @AllArgsConstructor
    public static class TeacherSummaryDto {
        private Long id;
        private String name;
    }

    @Data
    @AllArgsConstructor
    public static class EnrollmentSummaryDto {
        private Long id;
        private StudentSummaryDto student;
    }

    @Data
    @AllArgsConstructor
    public static class StudentSummaryDto {
        private Long id;
        private String name;
        private String email;
    }
}
