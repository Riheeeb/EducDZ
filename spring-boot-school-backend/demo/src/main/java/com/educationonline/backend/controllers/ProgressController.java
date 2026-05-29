package com.educationonline.backend.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.educationonline.backend.dtos.LessonDto;
import com.educationonline.backend.dtos.MeStatsDto;
import com.educationonline.backend.dtos.StudentProgressDto;
import com.educationonline.backend.entities.Lessons;
import com.educationonline.backend.mappers.LessonMapper;
import com.educationonline.backend.services.ProgressService;

import lombok.RequiredArgsConstructor;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    /** Mark a lesson complete (+10 points on first completion). */
    @PostMapping("/api/v1/lessons/{lessonId}/complete")
    public ResponseEntity<Void> completeLesson(
            @PathVariable Long lessonId,
            @RequestParam Long studentId) {
        progressService.markLessonCompleted(studentId, lessonId);
        return ResponseEntity.noContent().build();
    }

    /** Progress % for one course  */
    @GetMapping("/api/v1/courses/{courseId}/progress")
    public ResponseEntity<StudentProgressDto> courseProgress(
            @PathVariable Long courseId,
            @RequestParam Long studentId) {
        return ResponseEntity.ok(progressService.getCourseProgress(studentId, courseId));
    }

    /** Global progress % across all lessons the student can access (enrolled + open lessons). */
    @GetMapping("/api/v1/students/{studentId}/progress")
    public ResponseEntity<Double> studentGlobalProgress(@PathVariable Long studentId) {
        return ResponseEntity.ok(progressService.getStudentGlobalProgress(studentId));
    }

    /** Next lesson to resume, optionally scoped to a course. */
    @GetMapping("/api/v1/continue-learning")
public ResponseEntity<LessonDto> continueLearning(
        @RequestParam Long studentId,
        @RequestParam(required = false) Long courseId) {
    
    Lessons dto = progressService.getContinueLearningLesson(studentId, courseId);
    
    if (dto == null) {
        return ResponseEntity.noContent().build();
    }
    
    return ResponseEntity.ok(LessonMapper.toDto(dto));
}

    /**
     * Dashboard stats: lessons completed, number of enrollments, total points (student points).
     
     */
    @GetMapping("/api/me/stats")
    public ResponseEntity<MeStatsDto> meStats(@RequestParam Long studentId) {
        return ResponseEntity.ok(progressService.getMeStats(studentId));
    }
}
