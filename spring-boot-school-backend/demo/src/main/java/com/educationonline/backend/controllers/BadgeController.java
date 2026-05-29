package com.educationonline.backend.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.educationonline.backend.dtos.badgesDTOS.BadgeDTO;
import com.educationonline.backend.dtos.badgesDTOS.StudentBadgePageDTO;
import com.educationonline.backend.services.BadgeService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/badges")
@CrossOrigin(origins ="http://localhost:5173")

@RequiredArgsConstructor
public class BadgeController {

        private final BadgeService badgeService;

         @GetMapping("/student/{studentId}")
    public ResponseEntity<StudentBadgePageDTO> getStudentBadgePage(
            @PathVariable Long studentId) {
               
        return ResponseEntity.ok(badgeService.getStudentBadgePage(studentId));
    }

    @GetMapping
    public ResponseEntity<List<BadgeDTO>> getAllBadges(
            @RequestParam Long studentId) {
        return ResponseEntity.ok(badgeService.getAllBadges(studentId));
    }
}
