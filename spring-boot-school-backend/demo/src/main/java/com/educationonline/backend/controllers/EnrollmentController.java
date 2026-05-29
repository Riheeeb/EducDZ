package com.educationonline.backend.controllers;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.educationonline.backend.dtos.EnrollmentDto;
import com.educationonline.backend.entities.Enrollment;
import com.educationonline.backend.services.CourseService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class EnrollmentController {

    private final CourseService courseService;

    // Student actions
    @PostMapping("/students/{studentId}/courses/{courseId}/enroll")
    public ResponseEntity<EnrollmentDto> enroll(@PathVariable Long studentId, @PathVariable Long courseId) {
        return ResponseEntity.ok(EnrollmentDto.fromEntity(courseService.enrollStudent(studentId, courseId)));
    }

    @GetMapping("/students/{studentId}/enrollments")
    public ResponseEntity<List<EnrollmentDto>> myEnrollments(@PathVariable Long studentId) {
        return ResponseEntity.ok(courseService.getEnrolledCourses(studentId)
                .stream()
                .map(EnrollmentDto::fromEntity)
                .collect(Collectors.toList()));
    }

    @GetMapping("/students/{studentId}/enrollments/{courseId}")
    public ResponseEntity<EnrollmentDto> enrollmentDetails(@PathVariable Long studentId, @PathVariable Long courseId) {
        return ResponseEntity.ok(EnrollmentDto.fromEntity(courseService.getCourseProgress(studentId, courseId)));
    }

    @PostMapping("/students/{studentId}/enrollments/{courseId}/complete")
    public ResponseEntity<Enrollment> complete(@PathVariable Long studentId, @PathVariable Long courseId) {
        return ResponseEntity.ok(courseService.completeCourse(studentId, courseId));
    }

    @PostMapping("/students/{studentId}/enrollments/{courseId}/drop")
    public ResponseEntity<Void> drop(@PathVariable Long studentId, @PathVariable Long courseId) {
        courseService.dropCourse(studentId, courseId);
        return ResponseEntity.noContent().build();
    }

    // Teacher/dashboard actions
    @GetMapping("/courses/{courseId}/enrollments")
    public ResponseEntity<List<Enrollment>> courseEnrollments(@PathVariable Long courseId) {
        return ResponseEntity.ok(courseService.getAllStudentsInCourse(courseId));
    }
}
