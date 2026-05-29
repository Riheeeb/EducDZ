package com.educationonline.backend.dtos.search;

import java.util.List;

/**
 * Teacher name matches: courses summary plus attached videos/PDFs from published courses.
 */
public record TeacherSearchCardDto(
        Long teacherId,
        String teacherName,
        long publishedCourseCount,
        List<CourseLinkDto> courses,
        long videoCount,
        List<MediaItemDto> videos,
        long documentCount,
        List<MediaItemDto> documents,
        String teacherCoursesApiPath) {
}
