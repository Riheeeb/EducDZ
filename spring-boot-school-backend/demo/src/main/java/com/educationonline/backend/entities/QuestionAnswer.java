package com.educationonline.backend.entities;

import java.util.List;

import com.educationonline.backend.mappers.IntegerListConverter;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "question_answers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionAnswer {

     @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private QuizAttempts attempt;
 
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private QuizQuestion question;

    // the student's answer to this question, stored as text.
   @Convert(converter = IntegerListConverter.class)
    @Column(name = "given_answer", columnDefinition = "TEXT")
    private Object givenAnswer;

    private Boolean isCorrect;

    @Column(nullable = false, columnDefinition = "INT DEFAULT 0")
    private Integer pointsAwarded;
}
