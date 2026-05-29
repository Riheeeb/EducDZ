package com.educationonline.backend.dtos.profiles;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnrolledCourseCardDto {
/**
 * A small course card display inside YearCard
 */
    private Long courseId;
    private String courseTitle;
    private String courseDescription;
    private String teacherName;
    private String enrollmentDate;
    private String completionDate;
    private String status; 
    private int progressPercent;
    private int pointsEarned;
}
