package com.educationonline.backend.mappers;


import com.educationonline.backend.dtos.YearDto;
import com.educationonline.backend.entities.Years;


public class YearMapper {
    public static YearDto toDto(Years year) {
        return new YearDto(
            year.getId(),
            year.getYear() != null ? year.getYear().getValue() : null,  // "1AM"
            year.getYearType() != null ? year.getYearType().name() : null // "MIDDLE_SCHOOL"
        );
    }
}