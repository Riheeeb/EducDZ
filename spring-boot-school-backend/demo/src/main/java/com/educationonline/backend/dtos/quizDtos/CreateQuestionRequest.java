package com.educationonline.backend.dtos.quizDtos;

import java.util.List;

import com.educationonline.backend.entities.QuizQuestion.QuestionType;
import com.educationonline.backend.entities.QuizType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateQuestionRequest {

    // frontend to backend
    // one question inside a quiz creation request
     private String           questionText;
    private QuestionType     type;
    private Integer          points;
    private Integer          orderNumber;
    private List<CreateQuestionOption>     options;       // MULTIPLE_CHOICE only
    private Object         correctAnswer;
    
}