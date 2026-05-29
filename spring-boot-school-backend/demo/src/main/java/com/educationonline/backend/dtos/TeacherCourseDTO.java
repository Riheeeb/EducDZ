package com.educationonline.backend.dtos;

public record TeacherCourseDTO(
    Long id,
    String title,
    String description,
    String studentLevel,
    String year,
    String stream,
    String substream,
    boolean published,
    String teacherName,
    String createdAt,
    int lessonsCount,
    int enrolledCount
) {}