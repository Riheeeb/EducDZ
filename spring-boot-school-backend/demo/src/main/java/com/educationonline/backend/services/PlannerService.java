package com.educationonline.backend.services;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.educationonline.backend.dtos.planner.PlannerDtos.PlannerDataResponse;
import com.educationonline.backend.dtos.planner.PlannerDtos.PlannerExamDto;
import com.educationonline.backend.dtos.planner.PlannerDtos.PlannerExamRequest;
import com.educationonline.backend.dtos.planner.PlannerDtos.PlannerScheduleEntryDto;
import com.educationonline.backend.dtos.planner.PlannerDtos.PlannerScheduleEntryRequest;
import com.educationonline.backend.dtos.planner.PlannerDtos.PlannerSessionCompletionRequest;
import com.educationonline.backend.dtos.planner.PlannerDtos.PlannerSessionDto;
import com.educationonline.backend.dtos.planner.PlannerDtos.PlannerSessionRequest;
import com.educationonline.backend.entities.PlannerExam;
import com.educationonline.backend.entities.PlannerScheduleEntry;
import com.educationonline.backend.entities.PlannerSession;
import com.educationonline.backend.entities.students;
import com.educationonline.backend.repositories.PlannerExamRepository;
import com.educationonline.backend.repositories.PlannerScheduleEntryRepository;
import com.educationonline.backend.repositories.PlannerSessionRepository;
import com.educationonline.backend.repositories.studentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PlannerService {

    private static final List<String> DAY_ORDER = List.of("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun");
    private static final List<String> PLAN_TIME_SLOTS = List.of("16:00", "17:00", "18:00", "19:00", "20:00");

    private final studentRepository studentRepository;
    private final PlannerScheduleEntryRepository plannerScheduleEntryRepository;
    private final PlannerExamRepository plannerExamRepository;
    private final PlannerSessionRepository plannerSessionRepository;

    public PlannerDataResponse getPlannerData(Long studentId) {
        students student = getStudentOrThrow(studentId);
        return new PlannerDataResponse(
                plannerScheduleEntryRepository.findByStudentId(student.getId()).stream()
                        .sorted(scheduleComparator())
                        .map(this::toScheduleDto)
                        .toList(),
                plannerExamRepository.findByStudentId(student.getId()).stream()
                        .sorted(Comparator.comparing(PlannerExam::getExamDate))
                        .map(this::toExamDto)
                        .toList(),
                plannerSessionRepository.findByStudentId(student.getId()).stream()
                        .sorted(sessionComparator())
                        .map(this::toSessionDto)
                        .toList());
    }

    public PlannerScheduleEntryDto createScheduleEntry(Long studentId, PlannerScheduleEntryRequest request) {
        students student = getStudentOrThrow(studentId);
        PlannerScheduleEntry entry = new PlannerScheduleEntry();
        entry.setStudent(student);
        applyScheduleRequest(entry, request);
        return toScheduleDto(plannerScheduleEntryRepository.save(entry));
    }

    public PlannerScheduleEntryDto updateScheduleEntry(Long studentId, Long entryId, PlannerScheduleEntryRequest request) {
        students student = getStudentOrThrow(studentId);
        PlannerScheduleEntry entry = plannerScheduleEntryRepository.findByIdAndStudentId(entryId, student.getId())
                .orElseThrow(() -> new IllegalArgumentException("Planner entry not found"));
        applyScheduleRequest(entry, request);
        return toScheduleDto(plannerScheduleEntryRepository.save(entry));
    }

    public void deleteScheduleEntry(Long studentId, Long entryId) {
        students student = getStudentOrThrow(studentId);
        PlannerScheduleEntry entry = plannerScheduleEntryRepository.findByIdAndStudentId(entryId, student.getId())
                .orElseThrow(() -> new IllegalArgumentException("Planner entry not found"));
        plannerScheduleEntryRepository.delete(entry);
    }

    public PlannerExamDto createExam(Long studentId, PlannerExamRequest request) {
        students student = getStudentOrThrow(studentId);
        validateExamRequest(request);

        PlannerExam exam = new PlannerExam();
        exam.setStudent(student);
        exam.setSubject(normalize(request.subject()));
        exam.setExamDate(request.date());
        exam.setChapters(normalize(request.chapters()));
        return toExamDto(plannerExamRepository.save(exam));
    }

    public void deleteExam(Long studentId, Long examId) {
        students student = getStudentOrThrow(studentId);
        PlannerExam exam = plannerExamRepository.findByIdAndStudentId(examId, student.getId())
                .orElseThrow(() -> new IllegalArgumentException("Planner exam not found"));
        plannerExamRepository.delete(exam);
    }

    public List<PlannerSessionDto> generatePlan(Long studentId) {
        students student = getStudentOrThrow(studentId);
        List<PlannerExam> exams = plannerExamRepository.findByStudentId(student.getId());
        plannerSessionRepository.deleteByStudentIdAndGeneratedTrue(student.getId());

        if (!exams.isEmpty()) {
            LocalDate today = LocalDate.now();
            List<PlannerSession> generatedSessions = exams.stream()
                    .sorted(Comparator.comparing(PlannerExam::getExamDate))
                    .flatMap(exam -> buildSessionsForExam(student, exam, today).stream())
                    .toList();
            plannerSessionRepository.saveAll(generatedSessions);
        }

        return plannerSessionRepository.findByStudentId(student.getId()).stream()
                .sorted(sessionComparator())
                .map(this::toSessionDto)
                .toList();
    }

    public PlannerSessionDto createSession(Long studentId, PlannerSessionRequest request) {
        students student = getStudentOrThrow(studentId);
        PlannerSession session = new PlannerSession();
        session.setStudent(student);
        session.setGenerated(false);
        applySessionRequest(session, request);
        return toSessionDto(plannerSessionRepository.save(session));
    }

    public PlannerSessionDto updateSession(Long studentId, Long sessionId, PlannerSessionRequest request) {
        students student = getStudentOrThrow(studentId);
        PlannerSession session = plannerSessionRepository.findByIdAndStudentId(sessionId, student.getId())
                .orElseThrow(() -> new IllegalArgumentException("Planner session not found"));
        applySessionRequest(session, request);
        return toSessionDto(plannerSessionRepository.save(session));
    }

    public PlannerSessionDto updateSessionCompletion(Long studentId, Long sessionId,
            PlannerSessionCompletionRequest request) {
        students student = getStudentOrThrow(studentId);
        PlannerSession session = plannerSessionRepository.findByIdAndStudentId(sessionId, student.getId())
                .orElseThrow(() -> new IllegalArgumentException("Planner session not found"));
        session.setCompleted(request.completed());
        return toSessionDto(plannerSessionRepository.save(session));
    }

    public void deleteSession(Long studentId, Long sessionId) {
        students student = getStudentOrThrow(studentId);
        PlannerSession session = plannerSessionRepository.findByIdAndStudentId(sessionId, student.getId())
                .orElseThrow(() -> new IllegalArgumentException("Planner session not found"));
        plannerSessionRepository.delete(session);
    }

    private List<PlannerSession> buildSessionsForExam(students student, PlannerExam exam, LocalDate today) {
        LocalDate examDate = exam.getExamDate();
        List<String> chapters = List.of(exam.getChapters().split(",")).stream()
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .toList();
        int sessionsNeeded = Math.max(chapters.size(), 3);
        int daysUntilExam = Math.max(1, (int) (examDate.toEpochDay() - today.toEpochDay()));
        int gap = Math.max(1, daysUntilExam / sessionsNeeded);

        List<PlannerSession> result = new ArrayList<>();
        for (int i = 0; i < chapters.size(); i++) {
            LocalDate sessionDate = today.plusDays((long) i * gap);
            PlannerSession session = new PlannerSession();
            session.setStudent(student);
            session.setDayOfWeek(toShortDay(sessionDate.getDayOfWeek()));
            session.setTimeSlot(PLAN_TIME_SLOTS.get(i % PLAN_TIME_SLOTS.size()));
            session.setSubject(exam.getSubject());
            session.setTopic("Study: " + chapters.get(i));
            session.setCompleted(false);
            session.setGenerated(true);
            result.add(session);
        }

        PlannerSession revisionSession = new PlannerSession();
        LocalDate revisionDate = examDate.minusDays(1);
        revisionSession.setStudent(student);
        revisionSession.setDayOfWeek(toShortDay(revisionDate.getDayOfWeek()));
        revisionSession.setTimeSlot("10:00");
        revisionSession.setSubject(exam.getSubject());
        revisionSession.setTopic("Final Revision");
        revisionSession.setCompleted(false);
        revisionSession.setGenerated(true);
        result.add(revisionSession);

        return result;
    }

    private void applyScheduleRequest(PlannerScheduleEntry entry, PlannerScheduleEntryRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Planner entry data is required");
        }

        entry.setDayOfWeek(normalize(request.day()));
        entry.setTimeSlot(normalize(request.time()));
        entry.setSubject(normalize(request.subject()));
        entry.setTopic(normalize(request.topic()));
    }

    private void applySessionRequest(PlannerSession session, PlannerSessionRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Planner session data is required");
        }

        session.setDayOfWeek(normalize(request.day()));
        session.setTimeSlot(normalize(request.time()));
        session.setSubject(normalize(request.subject()));
        session.setTopic(normalize(request.topic()));
        session.setCompleted(request.completed() != null && request.completed());
    }

    private void validateExamRequest(PlannerExamRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Planner exam data is required");
        }
        normalize(request.subject());
        normalize(request.chapters());
        if (request.date() == null) {
            throw new IllegalArgumentException("Exam date is required");
        }
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Planner field is required");
        }
        return value.trim();
    }

    private students getStudentOrThrow(Long studentId) {
        Optional<students> directMatch = studentRepository.findById(studentId);
        if (directMatch.isPresent()) {
            return directMatch.get();
        }

        students byUserId = studentRepository.findByUserSId(studentId);
        if (byUserId != null) {
            return byUserId;
        }

        throw new IllegalArgumentException("Student not found");
    }

    private PlannerScheduleEntryDto toScheduleDto(PlannerScheduleEntry entry) {
        return new PlannerScheduleEntryDto(
                entry.getId(),
                entry.getDayOfWeek(),
                entry.getTimeSlot(),
                entry.getSubject(),
                entry.getTopic());
    }

    private PlannerExamDto toExamDto(PlannerExam exam) {
        return new PlannerExamDto(
                exam.getId(),
                exam.getSubject(),
                exam.getExamDate(),
                exam.getChapters());
    }

    private PlannerSessionDto toSessionDto(PlannerSession session) {
        return new PlannerSessionDto(
                session.getId(),
                session.getDayOfWeek(),
                session.getTimeSlot(),
                session.getSubject(),
                session.getTopic(),
                session.isCompleted(),
                session.isGenerated());
    }

    private Comparator<PlannerScheduleEntry> scheduleComparator() {
        return Comparator.comparingInt((PlannerScheduleEntry entry) -> dayPosition(entry.getDayOfWeek()))
                .thenComparing(PlannerScheduleEntry::getTimeSlot)
                .thenComparing(PlannerScheduleEntry::getSubject);
    }

    private Comparator<PlannerSession> sessionComparator() {
        return Comparator.comparingInt((PlannerSession session) -> dayPosition(session.getDayOfWeek()))
                .thenComparing(PlannerSession::getTimeSlot)
                .thenComparing(PlannerSession::getSubject)
                .thenComparing(PlannerSession::getTopic);
    }

    private int dayPosition(String day) {
        int index = DAY_ORDER.indexOf(day);
        return index >= 0 ? index : DAY_ORDER.size();
    }

    private String toShortDay(DayOfWeek dayOfWeek) {
        return switch (dayOfWeek) {
            case MONDAY -> "Mon";
            case TUESDAY -> "Tue";
            case WEDNESDAY -> "Wed";
            case THURSDAY -> "Thu";
            case FRIDAY -> "Fri";
            case SATURDAY -> "Sat";
            case SUNDAY -> "Sun";
        };
    }
}
