package com.educationonline.backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;



@AllArgsConstructor
@Getter
@Setter
public class YearDto {
    private Long id;
    private String name;       // "1AM", "1AS" etc
    private String yearType;   // "MIDDLE_SCHOOL" or "HIGH_SCHOOL"  ← add this
}


