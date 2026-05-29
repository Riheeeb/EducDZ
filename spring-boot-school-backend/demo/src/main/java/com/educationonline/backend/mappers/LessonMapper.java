package com.educationonline.backend.mappers;

import com.educationonline.backend.dtos.LessonDto;
import com.educationonline.backend.dtos.LessonDto.CourseSummaryDto;
import com.educationonline.backend.entities.Courses;
import com.educationonline.backend.entities.Lessons;
import com.educationonline.backend.entities.Ressources;
import com.educationonline.backend.entities.teachers;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Setter
@Getter
public class LessonMapper {

  public static LessonDto toDto(Lessons lesson) {
    if (lesson == null) return null;

    System.out.println("LessonMapper.toDto — lesson.getId(): " + lesson.getId());

    LessonDto dto = new LessonDto();
    dto.setId(lesson.getId());
    dto.setTitle(lesson.getTitle());
    dto.setContent(lesson.getContent());
    dto.setOrderNumber(lesson.getOrderNumber());

    if (lesson.getCourses() != null) {
        dto.setCourseId(lesson.getCourses().getId());
        dto.setCourseTitle(lesson.getCourses().getTitle());
        dto.setCourse(new LessonDto.CourseSummaryDto(lesson.getCourses().getId(), lesson.getCourses().getTitle()));
    }

    // ← null check before accessing getTeacher()
    if (lesson.getTeacher() != null) {
        dto.setTeacherId(lesson.getTeacher().getId());
    }

    // ← null check before accessing getResource()
    if (lesson.getResource() != null) {
        LessonDto.ResourceDto resourceDto = new LessonDto.ResourceDto();
        resourceDto.setId(lesson.getResource().getId());
        resourceDto.setVideoUrl(lesson.getResource().getVideoUrl());
        resourceDto.setPdfUrl(lesson.getResource().getPdfUrl());
        dto.setResource(resourceDto);
    }

    return dto;
}
   public static Lessons toEntity(LessonDto dto) {
    if (dto == null) return null;
    Lessons lesson = new Lessons();
    lesson.setTitle(dto.getTitle());
    lesson.setContent(dto.getContent());

    // handle courseId — dto has flat courseId field
    if (dto.getCourseId() != null) {
        Courses course = new Courses();
        course.setId(dto.getCourseId());
        lesson.setCourses(course);
    }

    // handle resource
    if (dto.getResource() != null) {
        Ressources resource = new Ressources();
        resource.setVideoUrl(dto.getResource().getVideoUrl());
        resource.setPdfUrl(dto.getResource().getPdfUrl());
        lesson.setResource(resource);
    }

    return lesson;
}
}
