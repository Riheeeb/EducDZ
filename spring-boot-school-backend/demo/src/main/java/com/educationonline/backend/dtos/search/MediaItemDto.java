package com.educationonline.backend.dtos.search;

public record MediaItemDto(
        Long lessonId,
        String lessonTitle,
        Long courseId,
        String courseTitle,
        String url) {
}
