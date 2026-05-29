package com.educationonline.backend.dtos;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeacherProfileDto {
    private Long id;
    private String name;
    private String email;
    private String subject;
    private long totalPublishedCourses;
    private long totalCourses;
    private long totalLessons;
    private List<CourseDto> courses;
}
