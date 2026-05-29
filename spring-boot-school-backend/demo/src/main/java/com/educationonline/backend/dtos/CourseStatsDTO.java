package com.educationonline.backend.dtos;

import lombok.AllArgsConstructor;


public record CourseStatsDTO(
    Long  totalEnrolled,
    Long  totalCompleted,
    Double average
) {

    public CourseStatsDTO(long totalEnrolled, long totalCompleted, Double average) {
        this((Long) totalEnrolled, (Long) totalCompleted, average);
    }

}
