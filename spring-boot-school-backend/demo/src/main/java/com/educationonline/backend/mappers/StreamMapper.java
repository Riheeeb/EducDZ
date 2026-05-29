package com.educationonline.backend.mappers;

import com.educationonline.backend.dtos.StreamDto;
import com.educationonline.backend.entities.Streams;

public class StreamMapper {

    public static StreamDto toDto(Streams stream) {
        if (stream == null) return null;

        return new StreamDto(
                stream.getId(),
                stream.getStreamType() != null ? stream.getStreamType().getNamestream() : null,
                stream.getStreamType() != null ? stream.getStreamType().getId() : null
        );
    }
}
