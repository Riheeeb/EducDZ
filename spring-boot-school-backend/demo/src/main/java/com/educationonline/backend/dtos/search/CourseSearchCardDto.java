package com.educationonline.backend.dtos.search;

/**
 * Published course matched by title or description.
 */
public record CourseSearchCardDto(
        Long courseId,
        String courseTitle,
        Long teacherId,
        String teacherName,
        String viewCoursePath,
        String viewCourseApiPath,
        String moreFromTeacherApiPath,
        String moreFromTeacherPath) {
}
