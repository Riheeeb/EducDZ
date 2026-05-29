package com.educationonline.backend.dtos;

import java.time.LocalDateTime;

import com.educationonline.backend.entities.Enrollment;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentDto {
    private Long id;
    private Long studentId;
    private Long courseId;
    private String courseTitle;
    private String courseDescription;
    private String teacherName;
    private Integer progressPercent;
    private String status;
    private LocalDateTime enrolledAt;
    private LocalDateTime lastAccessedAt;

    public static EnrollmentDto fromEntity(Enrollment enrollment) {
        if (enrollment == null) {
            return null;
        }

        var course = enrollment.getCourses();
        var teacher = course != null ? course.getTeacher() : null;
        var teacherUser = teacher != null ? teacher.getUserT() : null;

        return new EnrollmentDto(
                enrollment.getId(),
                enrollment.getStudent() != null ? enrollment.getStudent().getId() : null,
                course != null ? course.getId() : null,
                course != null ? course.getTitle() : null,
                course != null ? course.getDescription() : null,
                teacherUser != null ? teacherUser.getName() : null,
                enrollment.getProgressPercent() != null ? enrollment.getProgressPercent() : 0,
                enrollment.getStatus() != null ? enrollment.getStatus().name() : null,
                enrollment.getEnrolledAt(),
                enrollment.getLastAccessedAt());
    }
}
