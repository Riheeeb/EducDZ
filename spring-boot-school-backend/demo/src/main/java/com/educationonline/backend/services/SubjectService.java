package com.educationonline.backend.services;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.hibernate.service.spi.ServiceException;
import org.springframework.stereotype.Service;

import com.educationonline.backend.dtos.Subjects;
import com.educationonline.backend.entities.subjects;
import com.educationonline.backend.repositories.sbjectsRepository;

import lombok.Getter;
import lombok.Setter;
@Setter
@Getter
@Service
public class SubjectService {

    private final sbjectsRepository subjectRepo;

    public SubjectService (sbjectsRepository subjectRepo){
        this.subjectRepo = subjectRepo;
    }


    public List<Subjects> getAllSubjects(){
        try{
        //GET data from DATABASE
        List<subjects> allsubjects = subjectRepo.findAll();
        //if no data found return empty list
        if (allsubjects.isEmpty()) {
            return Collections.emptyList();
        }

        //MAP entities to DTOs
        return allsubjects.stream().map(sub -> 
             new Subjects(sub.getId(), sub.getName()))
             .collect(Collectors.toList());
           
        

    }
    catch (Exception e){

        throw new ServiceException("error in get list");
    }
       
    }

}
