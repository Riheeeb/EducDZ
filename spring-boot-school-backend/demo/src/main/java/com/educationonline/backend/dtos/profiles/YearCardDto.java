package com.educationonline.backend.dtos.profiles;



import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class YearCardDto {

    private String yearLabel;         
    private String studentLevel;      
    private String academicPeriod;
    private String stream;
    private String substream;
    
    private int totalEnrolledCourses;
    private int totalCompletedCourses;

    /** Lessons marked complete in that academic year (across enrollments). */
    private int lessonsCompleted;
    
    private int pointsEarned;
    private int badgesEarned;
    private List<EnrolledCourseCardDto> courses;
}
