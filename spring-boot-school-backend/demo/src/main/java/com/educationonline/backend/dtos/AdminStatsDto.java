package com.educationonline.backend.dtos;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class AdminStatsDto {

    // counts
    private long totalStudents;
    private long totalTeachers;
    private long totalCourses;
    private long totalPublishedCourses;
    private long totalLessons;
    private long totalEnrollments;
    private long totalCompletedEnrollments;
 
    //  top lists 
    private List<PopularCourseDto> mostPopularCourses;   // top 5 by enrollment count
    private List<ActiveStudentDto> mostActiveStudents;   // top 5 by lessons completed
 
    
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PopularCourseDto {
        private Long   courseId;
        private String title;
        private String teacherName;
        private long   enrollmentCount;
    }
 
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ActiveStudentDto {
        private Long   studentId;
        private String name;
        private long   lessonsCompleted;
        private int    totalPoints;
    }
}
