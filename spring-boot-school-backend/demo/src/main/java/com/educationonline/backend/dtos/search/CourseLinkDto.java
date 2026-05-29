package com.educationonline.backend.dtos.search;

public record CourseLinkDto(
        Long courseId,
        String title,
        String viewCoursePath,
        String viewCourseApiPath) {
}
