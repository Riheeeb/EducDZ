package com.educationonline.backend.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.educationonline.backend.dtos.planner.PlannerDtos.PlannerDataResponse;
import com.educationonline.backend.dtos.planner.PlannerDtos.PlannerExamDto;
import com.educationonline.backend.dtos.planner.PlannerDtos.PlannerExamRequest;
import com.educationonline.backend.dtos.planner.PlannerDtos.PlannerScheduleEntryDto;
import com.educationonline.backend.dtos.planner.PlannerDtos.PlannerScheduleEntryRequest;
import com.educationonline.backend.dtos.planner.PlannerDtos.PlannerSessionCompletionRequest;
import com.educationonline.backend.dtos.planner.PlannerDtos.PlannerSessionDto;
import com.educationonline.backend.dtos.planner.PlannerDtos.PlannerSessionRequest;
import com.educationonline.backend.services.PlannerService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/students/{studentId}/planner")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class PlannerController {

    private final PlannerService plannerService;

    @GetMapping
    public PlannerDataResponse getPlanner(@PathVariable Long studentId) {
        return plannerService.getPlannerData(studentId);
    }

    @PostMapping("/schedule")
    public PlannerScheduleEntryDto createScheduleEntry(
            @PathVariable Long studentId,
            @RequestBody PlannerScheduleEntryRequest request) {
        return plannerService.createScheduleEntry(studentId, request);
    }

    @PutMapping("/schedule/{entryId}")
    public PlannerScheduleEntryDto updateScheduleEntry(
            @PathVariable Long studentId,
            @PathVariable Long entryId,
            @RequestBody PlannerScheduleEntryRequest request) {
        return plannerService.updateScheduleEntry(studentId, entryId, request);
    }

    @DeleteMapping("/schedule/{entryId}")
    public ResponseEntity<Void> deleteScheduleEntry(@PathVariable Long studentId, @PathVariable Long entryId) {
        plannerService.deleteScheduleEntry(studentId, entryId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/exams")
    public PlannerExamDto createExam(@PathVariable Long studentId, @RequestBody PlannerExamRequest request) {
        return plannerService.createExam(studentId, request);
    }

    @DeleteMapping("/exams/{examId}")
    public ResponseEntity<Void> deleteExam(@PathVariable Long studentId, @PathVariable Long examId) {
        plannerService.deleteExam(studentId, examId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/generate")
    public List<PlannerSessionDto> generatePlan(@PathVariable Long studentId) {
        return plannerService.generatePlan(studentId);
    }

    @PostMapping("/sessions")
    public PlannerSessionDto createSession(@PathVariable Long studentId, @RequestBody PlannerSessionRequest request) {
        return plannerService.createSession(studentId, request);
    }

    @PutMapping("/sessions/{sessionId}")
    public PlannerSessionDto updateSession(
            @PathVariable Long studentId,
            @PathVariable Long sessionId,
            @RequestBody PlannerSessionRequest request) {
        return plannerService.updateSession(studentId, sessionId, request);
    }

    @PatchMapping("/sessions/{sessionId}/completion")
    public PlannerSessionDto updateSessionCompletion(
            @PathVariable Long studentId,
            @PathVariable Long sessionId,
            @RequestBody PlannerSessionCompletionRequest request) {
        return plannerService.updateSessionCompletion(studentId, sessionId, request);
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Void> deleteSession(@PathVariable Long studentId, @PathVariable Long sessionId) {
        plannerService.deleteSession(studentId, sessionId);
        return ResponseEntity.noContent().build();
    }
}
