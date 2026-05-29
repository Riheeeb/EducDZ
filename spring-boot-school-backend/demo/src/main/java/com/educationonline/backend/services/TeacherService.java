package com.educationonline.backend.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.educationonline.backend.dtos.TeacherProfileDto;
import com.educationonline.backend.entities.teachers;
import com.educationonline.backend.repositories.CourseRepository;
import com.educationonline.backend.repositories.LessonRepository;
import com.educationonline.backend.repositories.teachersRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TeacherService {

    private final teachersRepository teachersRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final CourseService courseService;

    @Transactional(readOnly = true)
    public TeacherProfileDto getTeacherProfile(Long teacherId) {
        teachers teacher = teachersRepository.findById(teacherId)
                .orElseThrow(() -> new IllegalArgumentException("Teacher not found"));

        var user = teacher.getUserT();
        var subject = teacher.getSubject();

        return new TeacherProfileDto(
                teacher.getId(),
                user != null ? user.getName() : "Teacher",
                user != null ? user.getEmail() : "",
                subject != null ? subject.getName() : "",
                courseRepository.countByTeacherIdAndPublishedTrue(teacherId),
                courseRepository.countByTeacherId(teacherId),
                lessonRepository.countByTeacherId(teacherId),
                courseService.getAllCoursesByTeacherId(teacherId));
    }
}
