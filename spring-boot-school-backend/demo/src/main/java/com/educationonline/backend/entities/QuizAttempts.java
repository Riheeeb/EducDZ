package com.educationonline.backend.entities;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "quiz_attempts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAttempts {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    @JsonIgnoreProperties({ "questions", "attempts", "teacher", "course", "lesson" })
    private Quiz quiz;
 
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({ "progressList", "streams", "substream", "userS" })
    private students student;
 
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttemptStatus status;        
    /** Score as percentage 0–100. Null until submitted. */
    private Integer scorePercent;
 
    /** Actual points awarded ( from quiz.totalpoints). Null until submitted. */
    private Integer pointsAwarded;
 
    /** Track if this is a retry attempt (only wrong questions from previous attempt) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "previous_attempt_id")
    @JsonIgnore
    private QuizAttempts previousAttempt;
 
    /** One answer row per question. */
    @JsonIgnore
    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QuestionAnswer> answers;
 
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
 
    @PrePersist
    protected void onCreate() {
        startedAt = LocalDateTime.now();
        status    = AttemptStatus.IN_PROGRESS;
    }
 
    public enum AttemptStatus { 
        IN_PROGRESS,      // Student is actively taking the quiz
        SUBMITTED,        // Submitted but not all correct (partial success)
        COMPLETED         // All questions answered correctly - quiz locked
    }
}
