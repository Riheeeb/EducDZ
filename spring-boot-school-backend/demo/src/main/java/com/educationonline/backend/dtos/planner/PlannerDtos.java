package com.educationonline.backend.dtos.planner;

import java.time.LocalDate;
import java.util.List;

public final class PlannerDtos {
    private PlannerDtos() {
    }

    public record PlannerDataResponse(
            List<PlannerScheduleEntryDto> scheduleEntries,
            List<PlannerExamDto> exams,
            List<PlannerSessionDto> autoPlan) {
    }

    public record PlannerScheduleEntryDto(
            Long id,
            String day,
            String time,
            String subject,
            String topic) {
    }

    public record PlannerExamDto(
            Long id,
            String subject,
            LocalDate date,
            String chapters) {
    }

    public record PlannerSessionDto(
            Long id,
            String day,
            String time,
            String subject,
            String topic,
            boolean completed,
            boolean generated) {
    }

    public record PlannerScheduleEntryRequest(
            String day,
            String time,
            String subject,
            String topic) {
    }

    public record PlannerExamRequest(
            String subject,
            LocalDate date,
            String chapters) {
    }

    public record PlannerSessionRequest(
            String day,
            String time,
            String subject,
            String topic,
            Boolean completed) {
    }

    public record PlannerSessionCompletionRequest(
            boolean completed) {
    }
}
