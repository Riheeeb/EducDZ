package com.educationonline.backend.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.educationonline.backend.dtos.TeacherProfileDto;
import com.educationonline.backend.services.TeacherService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class TeacherController {

    private final TeacherService teacherService;

    @GetMapping("/teachers/{teacherId}/profile")
    public ResponseEntity<TeacherProfileDto> getTeacherProfile(@PathVariable Long teacherId) {
        return ResponseEntity.ok(teacherService.getTeacherProfile(teacherId));
    }
}
