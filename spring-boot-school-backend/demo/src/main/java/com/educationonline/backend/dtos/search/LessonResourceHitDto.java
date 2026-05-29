package com.educationonline.backend.dtos.search;

/**
 * Lesson or free-text match inside a published course; includes media when present.
 */
public record LessonResourceHitDto(
        Long lessonId,
        String lessonTitle,
        Long courseId,
        String courseTitle,
        Long teacherId,
        String teacherName,
        String videoUrl,
        String pdfUrl,
        String viewLessonPath,
        String viewCoursePath) {
}
