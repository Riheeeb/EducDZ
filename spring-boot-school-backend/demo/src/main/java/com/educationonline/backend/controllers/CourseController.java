package com.educationonline.backend.controllers;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.educationonline.backend.dtos.CourseDto;
import com.educationonline.backend.dtos.TeacherCourseOptionDto;
import com.educationonline.backend.dtos.YearDto;
import com.educationonline.backend.dtos.TeacherPublicCourses;
import com.educationonline.backend.entities.Courses;
import com.educationonline.backend.entities.StudentLevel;
import com.educationonline.backend.repositories.CourseRepository;
import com.educationonline.backend.services.CourseService;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "http://localhost:5173")
public class CourseController {

    private final CourseService courseService;
    private final CourseRepository courseRepository;

    public CourseController(CourseService courseService, CourseRepository courseRepository) {
        this.courseService = courseService;
        this.courseRepository = courseRepository;
    }

    @GetMapping("/courses")
    public ResponseEntity<Page<CourseDto>> getAllPublishedCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(courseService.getAllPublishedCourses(page, size));
    }

    /**
     * Filter published catalogue by stream / subject / academic year row (years.id).
     * Omit parameters to return all published courses (paginated).
     */
    @GetMapping("/courses/discover")
    public ResponseEntity<Page<CourseDto>> discoverCourses(
            @RequestParam(required = false) Long streamId,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Long yearId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(
                courseService.discoverPublishedCourses(streamId, subjectId, yearId, page, size));
    }

    @PostMapping("/courses")
    public ResponseEntity<CourseDto> createCourse(@RequestBody CourseDto course) {
        return ResponseEntity.ok(courseService.createCourse(course));
    }

    @GetMapping("/courses/{courseId}")//by id
    public ResponseEntity<CourseDto> getPublishedCourse(@PathVariable Long courseId) {
        
        
        return ResponseEntity.ok(courseService.getPublishedCourseById(courseId));
    }

    @PutMapping("/courses/{courseId}")
    public ResponseEntity<CourseDto> updateCourse(@PathVariable Long courseId, @RequestBody CourseDto updatedCourse) {
        
        return ResponseEntity.ok(courseService.updateCourse(courseId, updatedCourse));
    }

    @DeleteMapping("/courses/{courseId}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long courseId) {
        courseService.deleteCourse(courseId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/courses/{courseId}/publish")
    public ResponseEntity<CourseDto> publishCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(courseService.publishCourse(courseId));
    }

    @PostMapping("/courses/{courseId}/unpublish")
    public ResponseEntity<CourseDto> unpublishCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(courseService.unpublishCourse(courseId));
    }

    @GetMapping("/teachers/{teacherId}/courses")
    public ResponseEntity<TeacherPublicCourses> getTeacherCourses(
            @PathVariable Long teacherId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return ResponseEntity.ok(courseService.getPublishedCoursesByTeacher(teacherId, page, size));
    }

    @GetMapping("/teachers/{teacherId}/courses/all")
    public ResponseEntity<List<CourseDto>> getAllTeacherCourses(@PathVariable Long teacherId) {
        return ResponseEntity.ok(courseService.getAllCoursesByTeacherId(teacherId));
    }

    @GetMapping("/students/{studentId}/courses/popular")
    public ResponseEntity<Page<CourseDto>> getPopularCourses(
            @PathVariable Long studentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(
                courseService.getPopularCourses(studentId, page, size));
    }

    @GetMapping("/students/{studentId}/courses/recommended")
    public ResponseEntity<Page<CourseDto>> getRecommendedCourses(
            @PathVariable Long studentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(courseService.getRecomendedCourses(studentId, page, size));
    }

    @GetMapping("/students/{studentId}/courses/latest")
    public ResponseEntity<Page<CourseDto>> getLatestCourses(
            @PathVariable Long studentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(courseService.getLatestCourses(studentId, page, size));
    }

    @GetMapping("/teachers/{teacherId}/courses/options")
    public ResponseEntity<List<TeacherCourseOptionDto>> getTeacherCourseOptions(
            @PathVariable Long teacherId) {
       
        return ResponseEntity.ok(courseService.getTeacherCourseOptions( teacherId));
    }


}
