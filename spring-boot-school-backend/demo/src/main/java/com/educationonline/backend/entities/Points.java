package com.educationonline.backend.entities;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;

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
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "points")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Points {

     @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private students student;

    @Column(nullable = false)
    private Integer points;             // positive = credit

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Reason reason;

    private String description;         // human readable e.g. "Badge: First Steps"

    private Long referenceId;           // badgeId, quizAttemptId, enrollmentId...

    @CreatedDate
    private LocalDateTime createdAt;

    public enum Reason {
        LESSON_COMPLETED,
        QUIZ_PASSED,
        BADGE_AWARDED,
        COURSE_COMPLETED,
        ADMIN_ADJUSTMENT
    }
}
