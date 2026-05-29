package com.educationonline.backend.mappers;

import com.educationonline.backend.dtos.SubstreamDto;
import com.educationonline.backend.entities.substream;

public class SubstreamMapper {

    public static SubstreamDto toDto(substream substream){
        if(substream == null ) return null ;
        return new SubstreamDto(
            substream.getId(),
            substream.getNameSubstream()
        );
    }
}
