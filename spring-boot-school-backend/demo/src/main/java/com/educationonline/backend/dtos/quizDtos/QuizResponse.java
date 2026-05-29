package com.educationonline.backend.dtos.quizDtos;

import java.util.List;

import com.educationonline.backend.entities.QuestionAnswer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class QuizResponse {

    // full quiz question - sent to student when they open the quiz
    private Long            id;
    private String          title;
    private String          description;
     private String quizType;
    private Long courseId;
    private String courseTitle;
 private Long lessonId;
    private String lessonTitle;
     private Boolean         showCorrectAnswers;
         private List<QuestionResponse> questions;

    private int questionCount;
   
}
