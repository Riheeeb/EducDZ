package com.educationonline.backend.dtos;

public record OptionDto(
    Long id,
    String name,
    String title,
    String label,
    String value
) {}
