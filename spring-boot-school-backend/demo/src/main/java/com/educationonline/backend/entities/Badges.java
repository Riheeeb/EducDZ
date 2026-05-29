package com.educationonline.backend.entities;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "badges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Data
@EqualsAndHashCode(callSuper = false )
public class Badges {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name; // BIGGINER , etc.

    private String description;

    private String iconUrl;

        @Column(nullable = false, unique = true)
    private String code; // unique code to identify the badge (e.g., "BEGINNER", "INTERMEDIATE", etc.)


     @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BadgeTier tier;

    public enum BadgeTier {
        BRONZE, SILVER, GOLD, PLATINUM
    }

     /** Bonus points credited to the student when this badge is earned. */
    @Column(nullable = false, columnDefinition = "INT DEFAULT 0")
    private Integer bonusPoints;

     @Enumerated(EnumType.STRING)
    @Column(name = "badge_trigger", nullable = false)
    private BadgeTrigger trigger;  

    public enum BadgeTrigger {
        FIRST_LESSON, // student completes their very first lesson
        COURSE_COMPLETE, //student completes any course
        QUIZ_PERFECT, //student scores 100% on a quiz
        QUIZ_MASTER ,
        QUIZ_PASS, //student passes any quiz 
        STREAK_7_DAYS, //student learns 7 consecutive days
        POINTS_MILESTONE, //student reaches a points threshold
        FAST_LEARNER, //student completes a course in under 3 days
        TOP_STUDENT, //student ranks #1 in a course
        COMEBACK, //student returns to learning after 30 days of inactivity
        NEVER_GIVE_UP //student re-enrolls in a course they dropped
    }

    @JsonIgnore
    @OneToMany(mappedBy = "badge", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StudentBadge> studentBadges;

    /** For POINTS_MILESTONE trigger */
    private Integer pointsThreshold;
}
