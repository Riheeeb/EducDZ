package com.educationonline.backend.entities;

import java.time.LocalDateTime;

import jakarta.persistence.*;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.fasterxml.jackson.annotation.JsonBackReference;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@Entity
@Builder
@Table(name = "enrollments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference(value = "student-enrollments")
    @JoinColumn(name = "student_id", nullable = false)
    private students student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference(value = "course-enrollments")
    @JoinColumn(name = "course_id", nullable = false)
    private Courses courses;

    private Integer progressPercent; // percentage of course learned

   /*@Column(nullable = false, columnDefinition = "INT DEFAULT 0")
private Integer completedLessonsCount;*/

    @Column(nullable = false)
    private int pointsEarned;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "enrollment_status", nullable = false)
    private EnrollmentStatus status;

    @CreatedDate
    private LocalDateTime enrolledAt;

    public enum EnrollmentStatus {
        ACTIVE,
        COMPLETED,
        DROPPED
    }

    private LocalDateTime completedAt;
    private LocalDateTime droppedAt;
    private LocalDateTime lastAccessedAt;

    private Integer dropCount; // number of times the student has dropped this course


    @PrePersist
    void onCreate() {
        if (status == null) status = EnrollmentStatus.ACTIVE;
        if (dropCount == null) dropCount = 0;
        if (progressPercent == null) progressPercent = 0;
    }

}
