package com.educationonline.backend.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.educationonline.backend.dtos.Subjects;
import com.educationonline.backend.services.SubjectService;
import org.springframework.web.bind.annotation.GetMapping;



@RestController
@RequestMapping("/api/v1/subjects")
@CrossOrigin(origins ="http://localhost:5173")
public class SubjectController {

    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @GetMapping
    public ResponseEntity<List<Subjects>> getAllSubjects() {

        List<Subjects> subjects = subjectService.getAllSubjects();
        return ResponseEntity.ok(subjects);
       
    }
    
}
