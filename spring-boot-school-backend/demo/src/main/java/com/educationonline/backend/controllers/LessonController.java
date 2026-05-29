package com.educationonline.backend.controllers;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.educationonline.backend.services.LessonsService;
import com.educationonline.backend.dtos.LessonDto;
import com.educationonline.backend.entities.Courses;
import com.educationonline.backend.entities.Lessons;
import com.educationonline.backend.mappers.LessonMapper;
import com.educationonline.backend.services.CourseService;
import org.springframework.http.ResponseEntity;

import java.util.List;


@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "http://localhost:5173")
public class LessonController {

    private final LessonsService lessonsService;
    private final CourseService courseService;

    public LessonController(LessonsService lessonsService, CourseService courseService) {
        this.lessonsService = lessonsService;
        this.courseService = courseService;
    }


    // Open learning lessons endpoints
   @PostMapping("/lessons")
public ResponseEntity<LessonDto> createOpenLesson(@RequestBody LessonDto lesson) {

    return ResponseEntity.ok(lessonsService.createLesson(lesson));
}

@GetMapping("/teachers/{teacherId}/lessons")
public ResponseEntity<List<LessonDto>> getTeacherLessons(@PathVariable Long teacherId) {
    System.out.println("=== GET TEACHER LESSONS CALLED === teacherId: " + teacherId);
    try {
        List<LessonDto> lessons = lessonsService.getLessonsByTeacherId(teacherId);
        System.out.println("=== RETURNING " + lessons.size() + " lessons ===");
        return ResponseEntity.ok(lessons);
    } catch (Exception e) {
        System.out.println("=== ERROR: " + e.getMessage());
        e.printStackTrace();
        throw e;
    }
}
    @GetMapping("/lessons/{id}")
    public ResponseEntity<LessonDto> getOpenLessonById(@PathVariable Long id) {
        return ResponseEntity.ok(lessonsService.getLessonById(id));
    }
    
    @DeleteMapping("/lessons/{id}")
    public ResponseEntity<Void> deleteOpenLesson(@PathVariable Long id) {
        lessonsService.deleteLessons(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/lessons/{id}")
    public ResponseEntity<LessonDto> updateOpenLesson(@PathVariable Long id, @RequestBody LessonDto dto) {
        return ResponseEntity.ok(lessonsService.updateLesson(null, id, dto));
    }

    // Organized Learning
        @PostMapping("/courses/{courseId}/lessons")
        public ResponseEntity<LessonDto> createCourseLesson(@PathVariable Long courseId, @RequestBody LessonDto lesson) {
           
    return ResponseEntity.ok(lessonsService.createLesson(lesson));
        }
    
        @GetMapping("/courses/{courseId}/lessons")
        public ResponseEntity<List<LessonDto>> getCourseLessons(@PathVariable Long courseId) {
            return ResponseEntity.ok(lessonsService.getLessonsByCourseId(courseId));
        }
    
        @PutMapping("/courses/{courseId}/lessons/{lessonId}")
       public ResponseEntity<LessonDto> updateCourseLesson(
        @PathVariable Long courseId,
        @PathVariable Long lessonId,
        @RequestBody LessonDto dto) {

    return ResponseEntity.ok(
            lessonsService.updateLesson(courseId, lessonId, dto)
    );
}
    
        @DeleteMapping("/courses/{courseId}/lessons/{lessonId}")
        public ResponseEntity<Void> deleteCourseLesson(@PathVariable Long courseId, @PathVariable Long lessonId) {
            lessonsService.getLessonByCourse(courseId, lessonId);
            lessonsService.deleteLessons(lessonId);
            return ResponseEntity.noContent().build();
        }

    
}
