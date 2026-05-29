package com.educationonline.backend.dtos;



import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
public class Subjects {

    private Long id;
    private String namesubject;
    

    public Subjects (Long id, String namesubject){

        this.id = id;

        this.namesubject = namesubject;
    }

    


}
