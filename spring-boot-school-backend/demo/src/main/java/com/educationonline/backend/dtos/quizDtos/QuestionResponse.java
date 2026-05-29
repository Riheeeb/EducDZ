package com.educationonline.backend.dtos.quizDtos;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class QuestionResponse {

    //for one question in the quiz response
    private Long             id;
    private String           questionText;
    private String           type;           // MULTIPLE_CHOICE | TRUE_FALSE | SHORT_ANSWER
    private Integer          points;
    private Integer          orderNumber;
    private List<QuestionOptionResponse>     options;
    private Object   correctAnswer;
    
    private Object          givenAnswer;
    private Boolean          isCorrect;
}
