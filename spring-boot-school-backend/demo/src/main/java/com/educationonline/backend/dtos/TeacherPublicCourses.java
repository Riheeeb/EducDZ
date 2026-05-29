package com.educationonline.backend.dtos;

import java.util.List;

public record TeacherPublicCourses(
    long totalElements,           
    int totalPages,
    int number,                   
    int size,
    boolean first,
    boolean last,
    List<TeacherCourseDTO> content  
) {
    public TeacherPublicCourses(org.springframework.data.domain.Page<TeacherCourseDTO> page) {
        this(
            page.getTotalElements(),
            page.getTotalPages(),
            page.getNumber(),
            page.getSize(),
            page.isFirst(),
            page.isLast(),
            page.getContent()
        );
    }
}