package com.educationonline.backend.dtos.badgesDTOS;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BadgeAwardedDto {

    //Awarded badge notification (returned when a badge is newly earned)
     private String  badgeName;
    private String  badgeCode;
    private String  tier;
    private String  iconUrl;
    private int     bonusPointsAwarded;
    private String  message; 
}
