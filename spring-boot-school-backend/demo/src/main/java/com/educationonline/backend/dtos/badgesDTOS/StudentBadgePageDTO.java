package com.educationonline.backend.dtos.badgesDTOS;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder

public class StudentBadgePageDTO {

    private int totalEarned;
    private int bronzeCount;
    private int silverCount;
    private int goldCount;
    private int platinumCount;
    private int totalBonusPointsFromBadges;
    private int totalPoints;
 
    // --- earned badges (newest first) ---
    private List<BadgeDTO> earnedBadges;
 
    // --- not yet earned badges (what student can still unlock) ---
    private List<BadgeDTO> lockedBadges;
}
