package com.educationonline.backend.dtos.badgesDTOS;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder

public class BadgeDTO {

    private Long   id;
    private String code;
    private String name;
    private String description;
    private String iconUrl;
    private String tier;           // BRONZE | SILVER | GOLD | PLATINUM
    private int    bonusPoints;
    private String trigger;        // FIRST_LESSON | COURSE_COMPLETE | ...
    private Integer pointsThreshold; // only for POINTS_MILESTONE
    private boolean earned;        // true if THIS student already has it
    private String  earnedAt;      // date when earned, null if not earned
}
