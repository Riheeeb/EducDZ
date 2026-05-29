package com.educationonline.backend.controllers;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.educationonline.backend.dtos.profiles.StudentProfileDto;
import com.educationonline.backend.services.BadgeService;
import com.educationonline.backend.services.StreakService;
import com.educationonline.backend.services.StudentProfileService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/students")
@RequiredArgsConstructor
@CrossOrigin(origins ="http://localhost:5173")

public class StudentProfileController {

    private final StudentProfileService studentProfileService;
    private final BadgeService badgeService;
    private final StreakService streakService;


   @GetMapping("/{studentId}/profile")
    public StudentProfileDto getStudentProfile(@PathVariable Long studentId) {
        return studentProfileService.getStudentProfile(studentId);
    }

    @GetMapping("/{studentId}/quiz-perfect-first-attempts")
    public long getQuizPerfectFirstAttempts(@PathVariable Long studentId) {
        return badgeService.countPerfectFirstAttempts(studentId);
    }

    @GetMapping("/{studentId}/streak")
    public int getStreak(@PathVariable Long studentId) {
        return streakService.getCurrentStreak(studentId);
    }
}
