package com.educationonline.backend.dtos.search;

import java.util.List;

public record GlobalSearchResponse(
        String query,
        List<TeacherSearchCardDto> teachers,
        List<CourseSearchCardDto> courses,
        List<LessonResourceHitDto> lessonsAndResources) {
}
