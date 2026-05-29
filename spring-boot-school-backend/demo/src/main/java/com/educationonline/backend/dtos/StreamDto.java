package com.educationonline.backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@AllArgsConstructor
@Getter
@Setter
public class StreamDto {

    private Long id;
    private String name;
    private Long streamTypeId;
}
