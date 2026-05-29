package com.educationonline.backend.dtos.quizDtos;



    import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class QuizSummaryDto {
    private Long id;
    private String title;
    private String description;
    private String quizType;
    private Long courseId;
    private String courseTitle;
    private Long lessonId;
    private String lessonTitle;
    private Integer totalPoints;
    private Boolean showCorrectAnswers;
    private int questionCount;
}

