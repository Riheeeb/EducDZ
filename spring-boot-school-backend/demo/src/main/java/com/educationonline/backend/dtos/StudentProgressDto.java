package com.educationonline.backend.dtos;

public record StudentProgressDto(
        Long studentId,
        Long courseId,
        double progressPercent) {
}
