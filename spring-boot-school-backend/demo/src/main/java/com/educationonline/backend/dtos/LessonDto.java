package com.educationonline.backend.dtos;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LessonDto {

    public LessonDto(Long id2, String title2, String content2, Integer orderNumber2, Long long1, Object object,
            Object object2) {
        
    }

    private Long id;
    private String title;
    private String content;
    private Integer orderNumber;

    private Long courseId;
    private String courseTitle;
    private Long teacherId;
     private ResourceDto resource;  

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResourceDto {
        private Long id;
        private String videoUrl;
        private String pdfUrl;
    }
   
    private CourseSummaryDto course;

    @Data
    @AllArgsConstructor
    public static class CourseSummaryDto {
        private Long id;
        private String title;
    }
}