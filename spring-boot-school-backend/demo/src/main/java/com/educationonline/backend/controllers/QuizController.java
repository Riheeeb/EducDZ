package com.educationonline.backend.controllers;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
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
import com.educationonline.backend.dtos.quizDtos.CreateQuizRequest;
import com.educationonline.backend.dtos.quizDtos.QuestionOptionResponse;
import com.educationonline.backend.dtos.quizDtos.QuestionResponse;
import com.educationonline.backend.dtos.quizDtos.QuizResponse;
import com.educationonline.backend.dtos.quizDtos.QuizSummaryDto;
import com.educationonline.backend.dtos.quizDtos.SubmitQuizRequest;
import com.educationonline.backend.entities.Courses;
import com.educationonline.backend.entities.Quiz;
import com.educationonline.backend.entities.QuizAttempts;
import com.educationonline.backend.services.CourseService;
import com.educationonline.backend.services.QuizService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins ="http://localhost:5173")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    // teacher creates a quiz for a lesson or course
     @PostMapping("/quizzes")
    public ResponseEntity<QuizResponse> createQuiz(@RequestBody CreateQuizRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(quizService.createQuiz(req));
    }

     @DeleteMapping("/quizzes/{quizId}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable Long quizId) {
        quizService.deleteQuiz(quizId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/quizzes/{quizId}")
    public ResponseEntity<QuizResponse> updateQuiz(@PathVariable Long quizId, @RequestBody CreateQuizRequest req) {
        return ResponseEntity.ok(quizService.updateQuiz(quizId, req));
    }

    
@GetMapping("/teachers/{teacherId}/quizzes")
public ResponseEntity<List<QuizResponse>> getTeacherQuizzes(@PathVariable Long teacherId) {
    List<Quiz> quizzes = quizService.getQuizzesByTeacher(teacherId);
    
    List<QuizResponse> dtos = quizzes.stream().map(q -> {
        List<QuestionResponse> questions = q.getQuestions() != null
            ? q.getQuestions().stream().map(qq -> QuestionResponse.builder()
                .id(qq.getId())
                .questionText(qq.getQuestionText())
                .type(qq.getQuestionType().name())
                .points(qq.getPoints())
                .orderNumber(qq.getOrderNumber())
                // FIX: Map QuestionOption entities to QuestionOptionResponse DTOs
                .options(qq.getOptions() != null ? qq.getOptions().stream()
                    .map(o -> QuestionOptionResponse.builder()
                        .id(o.getId())
                        .optionText(o.getOptionText())
                        .optionIndex(o.getOptionIndex())
                        .build())
                    .collect(Collectors.toList()) : List.of())
                .correctAnswer(qq.getCorrectAnswer())
                .build()
            ).toList()
            : List.of();

        return QuizResponse.builder()
            .id(q.getId())
            .title(q.getTitle())
            .description(q.getDescription())
            .quizType(q.getQuizType() != null ? q.getQuizType().name() : null)
            .courseId(q.getCourse() != null ? q.getCourse().getId() : null)
            .courseTitle(q.getCourse() != null ? q.getCourse().getTitle() : null)
            .lessonId(q.getLesson() != null ? q.getLesson().getId() : null)
            .lessonTitle(q.getLesson() != null ? q.getLesson().getTitle() : null)
            .showCorrectAnswers(q.getShowCorrectAnswers())
            .questions(questions)
            .questionCount(questions.size())
            .build();
    }).collect(Collectors.toList());

    return ResponseEntity.ok(dtos);
}

    @GetMapping("/courses/{courseId}/quizzes")
    public ResponseEntity<List<QuizSummaryDto>> getCourseQuizzes(@PathVariable Long courseId) {
        return ResponseEntity.ok(quizService.getQuizzesByCourse(courseId));
    }

    @GetMapping("/lessons/{lessonId}/quizzes")
    public ResponseEntity<List<QuizSummaryDto>> getLessonQuizzes(@PathVariable Long lessonId) {
        return ResponseEntity.ok(quizService.getQuizzesByLesson(lessonId));
    }

    // for student to open the quiz and see all questions

    @GetMapping("/quizzes/{quizId}")
    public ResponseEntity<QuizResponse> getQuiz(
            @PathVariable Long quizId,
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) Long attemptId) {
        // If attemptId is provided, show only wrong questions from that attempt (retry mode)
        if (attemptId != null) {
            return ResponseEntity.ok(quizService.getQuizForRetake(quizId, attemptId));
        }
        // Otherwise, show all questions (first attempt mode)
        return ResponseEntity.ok(quizService.getQuizForStudent(quizId, studentId));
    }
    
    /**
     * Get list of wrong question IDs from a previous attempt.
     */
    @GetMapping("/attempts/{attemptId}/wrong-questions")
    public ResponseEntity<List<Long>> getWrongQuestions(@PathVariable Long attemptId) {
        return ResponseEntity.ok(quizService.getWrongQuestionIds(attemptId));
    }

    // post /api/v1/quizzes/{quizId}/attempts?studentId=123
   @PostMapping("/quizzes/{quizId}/attempts")
public ResponseEntity<?> startAttempt(
        @PathVariable Long quizId,
        @RequestParam Long studentId) {

    try {
        Map<String, Object> result =
                quizService.startAttempt(quizId, studentId);

        boolean resumed = (boolean) result.get("resumed");

        if (resumed) {
            return ResponseEntity.ok(result); // resume
        } else {
            return ResponseEntity.status(HttpStatus.CREATED).body(result); // new
        }

    } catch (IllegalStateException ex) {
        if ("Student has already completed this quiz with 100% score.".equals(ex.getMessage())) {
            return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", "You cannot try again because all your answers are already correct."
            ));
        }
        throw ex;
    }
}
    

    @PostMapping("/quizzes/submit")
public ResponseEntity<?> submitAttempt(@RequestBody SubmitQuizRequest req) {
    try {
        return ResponseEntity.ok(quizService.submitAttempt(req));
    } catch (IllegalStateException ex) {
        // Return 409 with a readable message instead of a server crash
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", ex.getMessage()));
    }
}

    // all past attempts by a student on a quiz — newest first
    @GetMapping("/quizzes/{quizId}/history")
    public ResponseEntity<List<QuizAttempts>> getHistory(
            @PathVariable Long quizId,
            @RequestParam  Long studentId) {
        return ResponseEntity.ok(quizService.getAttemptHistory(quizId, studentId));



}





@GetMapping("/quizzes/{quizId}/best")
    public ResponseEntity<QuizAttempts> getBestAttempt(
            @PathVariable Long quizId,
            @RequestParam  Long studentId) {
        Optional<QuizAttempts> best = quizService.getBestAttempt(quizId, studentId);
        return best.map(ResponseEntity::ok)
                   .orElse(ResponseEntity.notFound().build());
    }





}
