package com.educationonline.backend.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;

public record TeacherCourseOptionDto(
        @JsonProperty("id") Long id,
        @JsonProperty("title") String title
) {}
