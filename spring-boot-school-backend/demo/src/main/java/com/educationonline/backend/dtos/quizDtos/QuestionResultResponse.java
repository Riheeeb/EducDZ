package com.educationonline.backend.dtos.quizDtos;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class QuestionResultResponse {

    // for each question in the quiz, we return this info about the student's answer
    private Long    questionId;
    private String  questionText;
    private String  type;
    private Object  givenAnswer;       // what the student answered
    private Object  correctAnswer;     // shown only if quiz.showCorrectAnswers = true
  
    private Boolean isCorrect;
    private Integer pointsAwarded;
    private Integer questionPoints;
}
