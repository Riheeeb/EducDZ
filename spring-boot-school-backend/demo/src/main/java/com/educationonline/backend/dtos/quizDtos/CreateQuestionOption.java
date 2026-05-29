package com.educationonline.backend.dtos.quizDtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateQuestionOption {
    private String optionText;
    private Integer optionIndex;
}
