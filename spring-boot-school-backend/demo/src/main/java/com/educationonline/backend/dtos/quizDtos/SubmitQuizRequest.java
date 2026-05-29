package com.educationonline.backend.dtos.quizDtos;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SubmitQuizRequest {
 //frontend --> backend


 //list of questionId -> answerText .
     private Long                    attemptId;
    private Map<Long, Object> answers;
}
