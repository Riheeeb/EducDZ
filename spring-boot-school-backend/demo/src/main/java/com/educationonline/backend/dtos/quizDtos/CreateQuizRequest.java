package com.educationonline.backend.dtos.quizDtos;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonAlias;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateQuizRequest {

    private String   title;
    private String   description;
    private Long     lessonId;       // set if type = LESSON_QUIZ
    private Long     courseId;       // set if type = COURSE_EXAM
    @JsonAlias({"totalePoints", "totalPoints"})
    private Integer  totalPoints;      // e.g. 50
    private Integer  passingScore;     // e.g. 60
    private Boolean  showCorrectAnswers;
    private List<CreateQuestionRequest> questions;

}
