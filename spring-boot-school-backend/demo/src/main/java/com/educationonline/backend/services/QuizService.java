package com.educationonline.backend.services;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.educationonline.backend.dtos.quizDtos.*;
import com.educationonline.backend.entities.*;
import com.educationonline.backend.entities.QuizQuestion.QuestionType;
import com.educationonline.backend.repositories.*;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizAttemptsRepository quizAttemptsRepository;
    private final teachersRepository teachersRepository;
    private final studentRepository studentRepository;
    private final LessonRepository lessonRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final QuestionAnswerRepository questionAnswerRepository;
    private final BadgeService badgeService;
    private final PointRepository pointsRepository;
    private final QuizAttemptsRepository quizAttemptRepository;
    private final BadgeEngineService badgeEngine;
    private final PointsService pointsService;
    private final ProgressService progressService;

    // ── TEACHER: create and manage quizzes ───────────────────────────────────

    @Transactional
    public QuizResponse createQuiz(CreateQuizRequest quizRequest) {
        boolean hasLesson = quizRequest.getLessonId() != null;
        boolean hasCourse = quizRequest.getCourseId() != null;

        if (!hasLesson && !hasCourse)
            throw new IllegalArgumentException("Quiz must be associated with either a lesson or a course.");
        if (hasLesson && hasCourse)
            throw new IllegalArgumentException("Quiz must be associated with either a lesson or a course, but not both.");

        QuizType type = hasLesson ? QuizType.LESSON_QUIZ : QuizType.COURSE_QUIZ;

        Quiz quiz = Quiz.builder()
                .title(quizRequest.getTitle())
                .description(quizRequest.getDescription())
                .quizType(type)
                .totalpoints(quizRequest.getTotalPoints() != null ? quizRequest.getTotalPoints() : 50)
                .showCorrectAnswers(quizRequest.getShowCorrectAnswers() != null ? quizRequest.getShowCorrectAnswers() : true)
                .passingScore(quizRequest.getPassingScore() != null ? quizRequest.getPassingScore() : 60)
                .build();

        if (hasLesson) {
            Lessons lesson = lessonRepository.findById(quizRequest.getLessonId())
                    .orElseThrow(() -> new IllegalArgumentException("Lesson not found"));
            quiz.setLesson(lesson);
            quiz.setCourse(null);
            quiz.setTeacher(lesson.getTeacher());
        } else {
            Courses course = courseRepository.findById(quizRequest.getCourseId())
                    .orElseThrow(() -> new IllegalArgumentException("Course not found"));
            quiz.setCourse(course);
            quiz.setLesson(null);
            quiz.setTeacher(course.getTeacher());
        }

        if (quizRequest.getQuestions() != null && !quizRequest.getQuestions().isEmpty()) {
            quiz.setQuestions(buildQuizQuestions(quizRequest.getQuestions(), quiz));
        }

        return mapToQuizResponse(quizRepository.save(quiz));
    }

    private List<QuizQuestion> buildQuizQuestions(List<CreateQuestionRequest> questionRequests, Quiz quiz) {
        return questionRequests.stream().map(qDto -> {
            QuizQuestion question = QuizQuestion.builder()
                    .questionText(qDto.getQuestionText())
                    .questionType(qDto.getType())
                    .points(qDto.getPoints() != null ? qDto.getPoints() : 10)
                    .orderNumber(qDto.getOrderNumber())
                    .quiz(quiz)
                    .build();

            if (qDto.getType() == QuestionType.MULTIPLE_CHOICE || qDto.getType() == QuestionType.TRUE_FALSE) {
                Object correctAnswerObj = qDto.getCorrectAnswer();
                List<Integer> indexes;
                if (correctAnswerObj instanceof List)         indexes = toIntList((List<?>) correctAnswerObj);
                else if (correctAnswerObj instanceof Integer) indexes = List.of((Integer) correctAnswerObj);
                else                                          indexes = new ArrayList<>();
                question.setCorrectAnswer(indexes);
            } else if (qDto.getType() == QuestionType.SHORT_ANSWER) {
                Object correctAnswerObj = qDto.getCorrectAnswer();
                question.setCorrectAnswer(correctAnswerObj != null ? correctAnswerObj.toString() : "");
            }

            if (qDto.getOptions() != null) {
                List<QuestionOption> options = qDto.getOptions().stream()
                        .map(optDto -> QuestionOption.builder()
                                .optionText(optDto.getOptionText())
                                .optionIndex(optDto.getOptionIndex())
                                .question(question)
                                .build())
                        .collect(Collectors.toList());
                question.setOptions(options);
            }
            return question;
        }).collect(Collectors.toList());
    }

    @Transactional
    public void deleteQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));
        quizRepository.delete(quiz);
    }

    private QuizResponse mapToQuizResponse(Quiz quiz) {
        List<QuestionResponse> questions = quiz.getQuestions() != null
                ? quiz.getQuestions().stream().map(qq -> QuestionResponse.builder()
                        .id(qq.getId())
                        .questionText(qq.getQuestionText())
                        .type(qq.getQuestionType().name())
                        .points(qq.getPoints())
                        .orderNumber(qq.getOrderNumber())
                        .options(qq.getOptions() != null ? qq.getOptions().stream()
                                .map(o -> QuestionOptionResponse.builder()
                                        .id(o.getId())
                                        .optionText(o.getOptionText())
                                        .optionIndex(o.getOptionIndex())
                                        .build())
                                .collect(Collectors.toList()) : List.of())
                        .correctAnswer(qq.getCorrectAnswer())
                        .build())
                        .collect(Collectors.toList())
                : List.of();

        return QuizResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .quizType(quiz.getQuizType() != null ? quiz.getQuizType().name() : null)
                .courseId(quiz.getCourse() != null ? quiz.getCourse().getId() : null)
                .courseTitle(quiz.getCourse() != null ? quiz.getCourse().getTitle() : null)
                .lessonId(quiz.getLesson() != null ? quiz.getLesson().getId() : null)
                .lessonTitle(quiz.getLesson() != null ? quiz.getLesson().getTitle() : null)
                .showCorrectAnswers(quiz.getShowCorrectAnswers() != null ? quiz.getShowCorrectAnswers() : false)
                .questions(questions)
                .questionCount(questions.size())
                .build();
    }

    @Transactional
    public QuizResponse updateQuiz(Long quizId, CreateQuizRequest quizRequest) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));

        boolean hasLesson = quizRequest.getLessonId() != null;
        boolean hasCourse = quizRequest.getCourseId() != null;
        if (hasLesson == hasCourse)
            throw new IllegalArgumentException("Quiz must be associated with either a lesson or a course, but not both.");

        quiz.setTitle(quizRequest.getTitle());
        quiz.setDescription(quizRequest.getDescription());
        quiz.setQuizType(hasLesson ? QuizType.LESSON_QUIZ : QuizType.COURSE_QUIZ);
        quiz.setTotalpoints(quizRequest.getTotalPoints() != null ? quizRequest.getTotalPoints() : quiz.getTotalpoints());
        quiz.setShowCorrectAnswers(quizRequest.getShowCorrectAnswers() != null ? quizRequest.getShowCorrectAnswers() : quiz.getShowCorrectAnswers());

        if (hasLesson) {
            Lessons lesson = lessonRepository.findById(quizRequest.getLessonId())
                    .orElseThrow(() -> new IllegalArgumentException("Lesson not found"));
            quiz.setLesson(lesson);
            quiz.setCourse(null);
        } else {
            Courses course = courseRepository.findById(quizRequest.getCourseId())
                    .orElseThrow(() -> new IllegalArgumentException("Course not found"));
            quiz.setCourse(course);
            quiz.setLesson(null);
        }

        if (quizRequest.getQuestions() != null) {
            quiz.getQuestions().clear();
            quiz.getQuestions().addAll(buildQuizQuestions(quizRequest.getQuestions(), quiz));
        }

        quizRepository.save(quiz);
        Quiz savedQuiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));

        List<QuestionResponse> questionsResp = savedQuiz.getQuestions() != null
                ? savedQuiz.getQuestions().stream().map(qq -> QuestionResponse.builder()
                        .id(qq.getId())
                        .questionText(qq.getQuestionText())
                        .type(qq.getQuestionType().name())
                        .points(qq.getPoints())
                        .orderNumber(qq.getOrderNumber())
                        .options(qq.getOptions() != null ? qq.getOptions().stream()
                                .map(o -> QuestionOptionResponse.builder()
                                        .id(o.getId())
                                        .optionText(o.getOptionText())
                                        .optionIndex(o.getOptionIndex())
                                        .build())
                                .collect(Collectors.toList()) : List.of())
                        .correctAnswer(qq.getCorrectAnswer())
                        .build()).toList()
                : List.of();

        return QuizResponse.builder()
                .id(savedQuiz.getId())
                .title(savedQuiz.getTitle())
                .description(savedQuiz.getDescription())
                .quizType(savedQuiz.getQuizType() != null ? savedQuiz.getQuizType().name() : null)
                .courseId(savedQuiz.getCourse() != null ? savedQuiz.getCourse().getId() : null)
                .courseTitle(savedQuiz.getCourse() != null ? savedQuiz.getCourse().getTitle() : null)
                .lessonId(savedQuiz.getLesson() != null ? savedQuiz.getLesson().getId() : null)
                .lessonTitle(savedQuiz.getLesson() != null ? savedQuiz.getLesson().getTitle() : null)
                .showCorrectAnswers(savedQuiz.getShowCorrectAnswers() != null ? savedQuiz.getShowCorrectAnswers() : false)
                .questions(questionsResp)
                .questionCount(questionsResp.size())
                .build();
    }

    // ── STUDENT: take quizzes ────────────────────────────────────────────────

    public QuizResponse getQuiz(Long quizId) {
        return getQuizForStudent(quizId, null);
    }

    public QuizResponse getQuizForStudent(Long quizId, Long studentId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));

        if (studentId != null) {
            Long courseId = null;
            try {
                courseId = resolveCourseId(quiz);
            } catch (IllegalStateException e) {
                System.err.println("=== DEBUG getQuizForStudent resolveCourseId threw: " + e.getMessage());
            }
            System.err.println("=== DEBUG getQuizForStudent studentId=" + studentId + " courseId=" + courseId);
            if (courseId != null) {
                boolean enrolled = enrollmentRepository.existsByStudentIdAndCoursesId(studentId, courseId);
                System.err.println("=== DEBUG enrolled=" + enrolled);
                if (!enrolled)
                    throw new IllegalStateException("Student must be enrolled in the course to open this quiz.");
                progressService.touchCourse(studentId, courseId);
            }
        }

        List<QuestionResponse> questionResponses = quiz.getQuestions().stream()
                .map(q -> QuestionResponse.builder()
                        .id(q.getId())
                        .questionText(q.getQuestionText())
                        .type(q.getQuestionType().name())
                        .points(q.getPoints())
                        .orderNumber(q.getOrderNumber())
                        .options(q.getQuestionType() != QuestionType.SHORT_ANSWER
                                ? q.getOptions().stream()
                                        .map(o -> QuestionOptionResponse.builder()
                                                .id(o.getId())
                                                .optionText(o.getOptionText())
                                                .optionIndex(o.getOptionIndex())
                                                .build())
                                        .collect(Collectors.toList())
                                : null)
                        .build())
                .collect(Collectors.toList());

        return QuizResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .quizType(quiz.getQuizType().name())
                .courseId(quiz.getCourse() != null ? quiz.getCourse().getId()
                        : quiz.getLesson() != null && quiz.getLesson().getCourses() != null
                                ? quiz.getLesson().getCourses().getId() : null)
                .courseTitle(quiz.getCourse() != null ? quiz.getCourse().getTitle()
                        : quiz.getLesson() != null && quiz.getLesson().getCourses() != null
                                ? quiz.getLesson().getCourses().getTitle() : null)
                .lessonId(quiz.getLesson() != null ? quiz.getLesson().getId() : null)
                .lessonTitle(quiz.getLesson() != null ? quiz.getLesson().getTitle() : null)
                .showCorrectAnswers(quiz.getShowCorrectAnswers() != null ? quiz.getShowCorrectAnswers() : false)
                .questions(questionResponses)
                .questionCount(questionResponses.size())
                .build();
    }

    public QuizResponse getQuizForRetake(Long quizId, Long attemptId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));

        List<Long> wrongQuestionIds = getWrongQuestionIds(attemptId);

        List<QuestionResponse> wrongQuestions = quiz.getQuestions().stream()
                .filter(q -> wrongQuestionIds.contains(q.getId()))
                .map(q -> QuestionResponse.builder()
                        .id(q.getId())
                        .questionText(q.getQuestionText())
                        .type(q.getQuestionType().name())
                        .points(q.getPoints())
                        .orderNumber(q.getOrderNumber())
                        .options(q.getQuestionType() != QuestionType.SHORT_ANSWER
                                ? q.getOptions().stream()
                                        .map(o -> QuestionOptionResponse.builder()
                                                .id(o.getId())
                                                .optionText(o.getOptionText())
                                                .optionIndex(o.getOptionIndex())
                                                .build())
                                        .collect(Collectors.toList())
                                : null)
                        .build())
                .collect(Collectors.toList());

        return QuizResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle() + " (Retry - Wrong Questions Only)")
                .quizType(quiz.getQuizType().name())
                .questions(wrongQuestions)
                .build();
    }

    @Transactional
    public Map<String, Object> startAttempt(Long quizId, Long studentId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));

        Long courseId = null;
        try {
            courseId = resolveCourseId(quiz);
        } catch (IllegalStateException e) {
            // standalone lesson quiz — no enrollment check needed
        }
        if (courseId != null && !enrollmentRepository.existsByStudentIdAndCoursesId(studentId, courseId))
            throw new IllegalStateException("Student must be enrolled in the course to take this quiz.");

        boolean completedAttemptExists = quizAttemptsRepository
                .existsByStudentIdAndQuizIdAndStatus(studentId, quizId, QuizAttempts.AttemptStatus.COMPLETED);
        if (completedAttemptExists)
            throw new IllegalStateException("Student has already completed this quiz with 100% score.");

        Optional<QuizAttempts> existingAttempt = quizAttemptsRepository
                .findByStudentIdAndQuizIdAndStatus(studentId, quizId, QuizAttempts.AttemptStatus.IN_PROGRESS);

        if (existingAttempt.isPresent()) {
            QuizAttempts existing = existingAttempt.get();
            // If submittedAt is set the attempt was already submitted but the status
            // column was never updated (crash/rollback). Repair it and create a fresh one.
            if (existing.getSubmittedAt() != null) {
                existing.setStatus(QuizAttempts.AttemptStatus.SUBMITTED);
                quizAttemptsRepository.save(existing);
                // fall through to create a new attempt
            } else {
                return Map.of("attempt", existing, "resumed", true);
            }
        }

        students student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found: " + studentId));

        Optional<QuizAttempts> lastSubmittedAttempt = quizAttemptsRepository
                .findFirstByStudentIdAndQuizIdAndStatusOrderBySubmittedAtDesc(
                        studentId, quizId, QuizAttempts.AttemptStatus.SUBMITTED);

        QuizAttempts attempt = QuizAttempts.builder()
                .quiz(quiz)
                .student(student)
                .previousAttempt(lastSubmittedAttempt.orElse(null))
                .build();

        return Map.of("attempt", quizAttemptsRepository.save(attempt), "resumed", false);
    }

    @Transactional
    public QuizResponse submitAttempt(SubmitQuizRequest req) {
        QuizAttempts attempt = quizAttemptsRepository.findById(req.getAttemptId())
                .orElseThrow(() -> new IllegalStateException("Attempt not found: " + req.getAttemptId()));

        if (attempt.getStatus() == QuizAttempts.AttemptStatus.SUBMITTED
                || attempt.getStatus() == QuizAttempts.AttemptStatus.COMPLETED)
            throw new IllegalStateException("This attempt has already been submitted.");

        Quiz quiz = attempt.getQuiz();
        Map<Long, Object> answers = req.getAnswers();

        long priorAttemptCount = quizAttemptsRepository
                .countByStudentIdAndQuizIdAndStatusIn(
                        attempt.getStudent().getId(),
                        quiz.getId(),
                        List.of(QuizAttempts.AttemptStatus.SUBMITTED,
                                QuizAttempts.AttemptStatus.COMPLETED));
        boolean isFirstAttempt = priorAttemptCount == 0;

        int totalPossiblePoints = 0;
        int totalEarnedPoints   = 0;
        List<QuestionAnswer> answerEntities      = new ArrayList<>();
        List<QuestionResultResponse> questionResults = new ArrayList<>();

        Map<Long, QuestionAnswer> previousAnswersByQuestion =
                attempt.getPreviousAttempt() != null
                        ? attempt.getPreviousAttempt().getAnswers().stream()
                                .collect(Collectors.toMap(a -> a.getQuestion().getId(), a -> a))
                        : Map.of();

        for (QuizQuestion q : quiz.getQuestions()) {
            Object rawGivenAnswer = answers.get(q.getId());

            // FIX: normalize the raw answer from Jackson before any casting.
            // Jackson may deserialize JSON numbers as Integer, Double, or Long
            // depending on the value — toSafeAnswer converts everything consistently.
            Object safeGiven = toSafeAnswer(rawGivenAnswer, q.getQuestionType());

            Object givenAnswer;
            boolean correct;
            int pointsForAnswer;

            boolean isEmptyAnswer = safeGiven == null
                    || (safeGiven instanceof List   && ((List<?>) safeGiven).isEmpty())
                    || (safeGiven instanceof String && ((String) safeGiven).trim().isEmpty());

            if (isEmptyAnswer && previousAnswersByQuestion.containsKey(q.getId())) {
                QuestionAnswer prev = previousAnswersByQuestion.get(q.getId());
                givenAnswer     = prev.getGivenAnswer();
                correct         = Boolean.TRUE.equals(prev.getIsCorrect());
                pointsForAnswer = correct ? q.getPoints() : 0;
            } else {
                givenAnswer     = safeGiven == null ? List.of() : safeGiven;
                correct         = isCorrect(q, givenAnswer);
                pointsForAnswer = correct ? q.getPoints() : 0;
            }

            totalPossiblePoints += q.getPoints();
            totalEarnedPoints   += pointsForAnswer;

            Object correctAnswer = null;
            if (quiz.getShowCorrectAnswers()) {
                Object raw = q.getCorrectAnswer();
                if (raw instanceof List || raw instanceof String) correctAnswer = raw;
            }

            answerEntities.add(QuestionAnswer.builder()
                    .attempt(attempt)
                    .question(q)
                    .givenAnswer(givenAnswer)
                    .isCorrect(correct)
                    .pointsAwarded(pointsForAnswer)
                    .build());

            questionResults.add(QuestionResultResponse.builder()
                    .questionId(q.getId())
                    .questionText(q.getQuestionText())
                    .type(q.getQuestionType().name())
                    .givenAnswer(givenAnswer)
                    .correctAnswer(correctAnswer)
                    .isCorrect(correct)
                    .pointsAwarded(pointsForAnswer)
                    .questionPoints(q.getPoints())
                    .build());
        }

        int scorePercent  = totalPossiblePoints == 0 ? 0
                : (int) Math.round((totalEarnedPoints * 100.0) / totalPossiblePoints);
        int pointsAwarded = (int) Math.round((scorePercent / 100.0) * quiz.getTotalpoints());

        int passingScore = quiz.getPassingScore() != null ? quiz.getPassingScore() : 60;
        boolean isPerfect = scorePercent == 100;
        boolean passed    = scorePercent >= passingScore;

        if (attempt.getAnswers() == null) attempt.setAnswers(new ArrayList<>());
        else                              attempt.getAnswers().clear();
        attempt.getAnswers().addAll(answerEntities);
        attempt.setScorePercent(scorePercent);
        attempt.setPointsAwarded(pointsAwarded);
        attempt.setStatus(isPerfect ? QuizAttempts.AttemptStatus.COMPLETED
                                    : QuizAttempts.AttemptStatus.SUBMITTED);
        attempt.setSubmittedAt(LocalDateTime.now());
        quizAttemptsRepository.save(attempt);

        if (isPerfect) {
            pointsRepository.save(Points.builder()
                    .student(attempt.getStudent())
                    .points(pointsAwarded)
                    .reason(Points.Reason.QUIZ_PASSED)
                    .description("Completed quiz perfectly: " + quiz.getTitle())
                    .referenceId(attempt.getId())
                    .build());
        }

        try {
            badgeService.onQuizSubmitted(
                    attempt.getStudent().getId(), scorePercent, passed, isFirstAttempt);
        } catch (Exception e) {
            System.err.println("=== BADGE FAILED: " + e.getMessage());
            e.printStackTrace();
        }

        try {
            Long courseId = resolveCourseId(quiz);
            progressService.refreshCourseProgress(attempt.getStudent().getId(), courseId);
        } catch (Exception e) {
            // standalone lesson quiz — no course progress to refresh
        }
        return QuizResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .quizType(quiz.getQuizType().name())
                .questions(questionResults.stream()
                        .map(r -> QuestionResponse.builder()
                                .id(r.getQuestionId())
                                .questionText(r.getQuestionText())
                                .type(r.getType())
                                .points(r.getQuestionPoints())
                                .options(List.of())
                                .givenAnswer(r.getGivenAnswer())
                                .correctAnswer(r.getCorrectAnswer())
                                .isCorrect(r.getIsCorrect())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    public List<QuizAttempts> getAttemptHistory(Long quizId, Long studentId) {
        return quizAttemptsRepository.findByStudentIdAndQuizIdOrderByStartedAtDesc(studentId, quizId);
    }

    public Optional<QuizAttempts> getBestAttempt(Long quizId, Long studentId) {
        return quizAttemptsRepository.findBestAttempt(studentId, quizId);
    }

    /**
     * FIX: Convert a raw Jackson-deserialized answer to the correct Java type
     * before grading. Jackson may produce Integer, Double, Long, or String for
     * numeric values depending on context — this normalizes all of them.
     */
    private Object toSafeAnswer(Object raw, QuestionType type) {
        if (raw == null) return null;

        if (type == QuestionType.SHORT_ANSWER) {
            return raw.toString();
        }

        // MULTIPLE_CHOICE / TRUE_FALSE — expect List<Integer>
        if (raw instanceof List) {
            return toIntList((List<?>) raw);
        }

        // Single bare number sent instead of a list (shouldn't happen, but guard it)
        try {
            return List.of(Integer.parseInt(raw.toString().trim()));
        } catch (NumberFormatException e) {
            return List.of();
        }
    }

    /**
     * FIX: Safe List<?> → List<Integer> conversion.
     * Avoids ClassCastException when Jackson produces Double/Long instead of Integer.
     */
    private List<Integer> toIntList(List<?> list) {
        List<Integer> result = new ArrayList<>();
        for (Object item : list) {
            if (item == null) continue;
            try {
                result.add(Integer.parseInt(item.toString().trim()));
            } catch (NumberFormatException e) {
                // skip unparseable items
            }
        }
        return result;
    }

    /**
     * FIX: Safe set-equality check — uses toIntList so both sides are
     * normalized before comparison, avoiding ClassCastException.
     */
    private boolean isCorrect(QuizQuestion q, Object givenAnswer) {
        Object correct = q.getCorrectAnswer();

        if (q.getQuestionType() == QuestionType.SHORT_ANSWER) {
            if (givenAnswer == null || correct == null) return false;
            String given  = givenAnswer.toString().trim().replaceAll("\\s+", " ");
            String expect = correct.toString().trim().replaceAll("\\s+", " ");
            return given.equalsIgnoreCase(expect);
        }

        if (!(givenAnswer instanceof List) || !(correct instanceof List)) return false;

        // FIX: convert both sides through toIntList — never cast directly
        Set<Integer> givenSet   = new HashSet<>(toIntList((List<?>) givenAnswer));
        Set<Integer> correctSet = new HashSet<>(toIntList((List<?>) correct));
        return givenSet.equals(correctSet);
    }

    private Long resolveCourseId(Quiz quiz) {
        if (quiz.getCourse() != null) return quiz.getCourse().getId();
        if (quiz.getLesson() != null && quiz.getLesson().getCourses() != null)
            return quiz.getLesson().getCourses().getId();
        throw new IllegalStateException("Quiz is not attached to any course or lesson.");
    }

    public Quiz findById(Long quizId) {
        return quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalStateException("Quiz not found: " + quizId));
    }

    @Transactional(readOnly = true)
    public List<Quiz> getQuizzesByTeacher(Long teacherId) {
        teachersRepository.findById(teacherId)
                .orElseThrow(() -> new IllegalArgumentException("Teacher not found"));
        return quizRepository.findAllByTeacherIdWithQuestions(teacherId);
    }

    @Transactional(readOnly = true)
    public List<QuizSummaryDto> getQuizzesByCourse(Long courseId) {
        courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        return quizRepository.findAllByCourseIdIncludingLessonQuizzes(courseId).stream()
                .map(quiz -> new QuizSummaryDto(
                        quiz.getId(), quiz.getTitle(), quiz.getDescription(),
                        quiz.getQuizType() != null ? quiz.getQuizType().name() : null,
                        quiz.getCourse() != null ? quiz.getCourse().getId() : courseId,
                        quiz.getCourse() != null ? quiz.getCourse().getTitle() : null,
                        quiz.getLesson() != null ? quiz.getLesson().getId() : null,
                        quiz.getLesson() != null ? quiz.getLesson().getTitle() : null,
                        quiz.getTotalpoints(), quiz.getShowCorrectAnswers(),
                        quiz.getQuestions() != null ? quiz.getQuestions().size() : 0))
                .toList();
    }

    public List<QuizSummaryDto> getQuizzesByLesson(Long lessonId) {
        return quizRepository.findByLessonId(lessonId)
                .map(quiz -> List.of(new QuizSummaryDto(
                        quiz.getId(), quiz.getTitle(), quiz.getDescription(),
                        quiz.getQuizType() != null ? quiz.getQuizType().name() : null,
                        quiz.getCourse() != null ? quiz.getCourse().getId() : null,
                        quiz.getCourse() != null ? quiz.getCourse().getTitle() : null,
                        quiz.getLesson().getId(),
                        quiz.getLesson().getTitle(),
                        quiz.getTotalpoints(), quiz.getShowCorrectAnswers(),
                        quiz.getQuestions() != null ? quiz.getQuestions().size() : 0)))
                .orElse(List.of());
    }

    @Transactional(readOnly = true)
    public List<Long> getWrongQuestionIds(Long previousAttemptId) {
        QuizAttempts attempt = quizAttemptsRepository.findById(previousAttemptId)
                .orElseThrow(() -> new IllegalArgumentException("Attempt not found"));
        return attempt.getAnswers().stream()
                .filter(a -> !a.getIsCorrect())
                .map(a -> a.getQuestion().getId())
                .collect(Collectors.toList());
    }

    @Transactional
    public void submitQuiz(Long studentId, Long quizId, int score, int passingScore) {
        boolean passed = score >= passingScore;

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found"));
        students student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));

        long priorAttemptCount = quizAttemptRepository
                .countByStudentIdAndQuizIdAndStatusIn(studentId, quizId,
                        List.of(QuizAttempts.AttemptStatus.SUBMITTED,
                                QuizAttempts.AttemptStatus.COMPLETED));
        boolean isFirstAttempt = priorAttemptCount == 0;

        QuizAttempts attempt = QuizAttempts.builder()
                .quiz(quiz).student(student)
                .scorePercent(score)
                .status(passed ? QuizAttempts.AttemptStatus.COMPLETED : QuizAttempts.AttemptStatus.SUBMITTED)
                .submittedAt(LocalDateTime.now())
                .build();
        quizAttemptRepository.save(attempt);

        if (passed)       pointsService.addPoints(studentId, 20, "QUIZ_PASSED");
        if (score == 100) pointsService.addPoints(studentId, 10, "QUIZ_PERFECT");

        badgeEngine.handleEvent(studentId, BadgeEventType.QUIZ_SUBMITTED,
                Map.of("quizId", quizId, "score", score, "passed", passed,
                        "isFirstAttempt", isFirstAttempt, "perfect", score == 100));
    }
}