package com.educationonline.backend.services;

import java.util.List;
import java.util.stream.Collectors;



import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import com.educationonline.backend.dtos.AdminStatsDto;
import com.educationonline.backend.dtos.AdminStatsDto.ActiveStudentDto;
import com.educationonline.backend.dtos.AdminStatsDto.PopularCourseDto;
import com.educationonline.backend.entities.AccountType;
import com.educationonline.backend.entities.Badges;
import com.educationonline.backend.entities.Courses;
import com.educationonline.backend.entities.Enrollment;
import com.educationonline.backend.entities.Streams;
import com.educationonline.backend.entities.Years;
import com.educationonline.backend.entities.students;
import com.educationonline.backend.entities.subjects;
import com.educationonline.backend.entities.teachers;
import com.educationonline.backend.entities.users;
import com.educationonline.backend.repositories.*;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
@Service
@RequiredArgsConstructor
public class AdminService {

    private final usersRepository usersRepository;
    private final studentRepository studentRepository;
    private final teachersRepository teacherRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LessonRepository lessonRepository;
    private final sbjectsRepository subjectRepository;
    private final BadgeRepository badgeRepository;
    private final StreamRepository streamRepository;
    private final ProgressRepository progressRepository;
    private final yearRepo yearRepository;
    private final PointRepository pointRepository;
    private final StudentBadgeRepository studentBadgeRepository;
    private final PlannerExamRepository plannerExamRepository;
    private final PlannerScheduleEntryRepository plannerScheduleEntryRepository;
    private final PlannerSessionRepository plannerSessionRepository;
    private final QuizAttemptsRepository quizAttemptsRepository;
    private final QuizRepository quizRepository;
    private final NotificationRepository notificationRepository;

     public AdminStatsDto getStats() {
 
        long totalStudents   = studentRepository.count();
        long totalTeachers   = teacherRepository.count();
        long totalCourses    = courseRepository.count();
        long totalPublished  = courseRepository.countByPublishedTrue();
        long totalLessons    = lessonRepository.count();
        long totalEnrollments = enrollmentRepository.count();
        long totalCompleted  = enrollmentRepository
                .countByStatus(Enrollment.EnrollmentStatus.COMPLETED);
 
        // top 5 courses by enrollment count
        List<PopularCourseDto> popularCourses = courseRepository
                .findAll()
                .stream()
                .map(c -> {
                    long count = enrollmentRepository.countByCoursesId(c.getId());
                    String teacherName = c.getTeacher() != null
                            && c.getTeacher().getUserT() != null
                            ? c.getTeacher().getUserT().getName() : "";
                    return PopularCourseDto.builder()
                            .courseId(c.getId())
                            .title(c.getTitle())
                            .teacherName(teacherName)
                            .enrollmentCount(count)
                            .build();
                })
                .sorted((a, b) -> Long.compare(b.getEnrollmentCount(), a.getEnrollmentCount()))
                .limit(5)
                .collect(Collectors.toList());
 
        // top 5 students by lessons completed
        List<ActiveStudentDto> activeStudents = studentRepository
                .findAll()
                .stream()
                .map(s -> {
                    long lessonsCompleted = progressRepository
                            .countByStudentIdAndCompletedTrue(s.getId());
                    int points = pointRepository.getTotalPointsByStudentId(s.getId());
                    String name = s.getUserS() != null ? s.getUserS().getName() : "";
                    return ActiveStudentDto.builder()
                            .studentId(s.getId())
                            .name(name)
                            .lessonsCompleted(lessonsCompleted)
                            .totalPoints(points)
                            .build();
                })
                .sorted((a, b) -> Long.compare(b.getLessonsCompleted(), a.getLessonsCompleted()))
                .limit(5)
                .collect(Collectors.toList());
 
        return AdminStatsDto.builder()
                .totalStudents(totalStudents)
                .totalTeachers(totalTeachers)
                .totalCourses(totalCourses)
                .totalPublishedCourses(totalPublished)
                .totalLessons(totalLessons)
                .totalEnrollments(totalEnrollments)
                .totalCompletedEnrollments(totalCompleted)
                .mostPopularCourses(popularCourses)
                .mostActiveStudents(activeStudents)
                .build();
    }

    /** All users (students + teachers) paginated. */
    public Page<users> getAllUsers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return usersRepository.findAll(pageable);
    }
 
    /** Get any user by id. */
    public users getUserById(Long id) {
        return usersRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("User not found: " + id));
    }
 
    /** Delete any user account (cascades to student/teacher profile). */
    @Transactional
    public void deleteUser(Long id) {
        users user = getUserById(id);
        if (user.getAccountType() == AccountType.STUDENT) {
            deleteStudentData(id);
        } else if (user.getAccountType() == AccountType.TEACHER) {
            deleteTeacherData(id);
        }
        usersRepository.deleteById(id);
    }

    private void deleteStudentData(Long studentId) {
        notificationRepository.deleteByStudentId(studentId);
        plannerSessionRepository.deleteByStudentId(studentId);
        plannerScheduleEntryRepository.deleteByStudentId(studentId);
        plannerExamRepository.deleteByStudentId(studentId);
        pointRepository.deleteByStudentId(studentId);
        studentBadgeRepository.deleteByStudentId(studentId);
        quizAttemptsRepository.clearPreviousAttemptsForStudent(studentId);
        quizAttemptsRepository.deleteAll(quizAttemptsRepository.findByStudentId(studentId));
        enrollmentRepository.deleteByStudentId(studentId);
    }

    private void deleteTeacherData(Long teacherId) {
        notificationRepository.deleteByTeacherId(teacherId);
        quizRepository.deleteAll(quizRepository.findByTeacherIdAndCourseIsNullAndLessonIsNull(teacherId));
        lessonRepository.deleteAll(lessonRepository.findByTeacherIdAndCoursesIsNull(teacherId));
        courseRepository.deleteAll(courseRepository.findByTeacherId(teacherId));
    }
 
    /** Ban a user — sets enabled = false so JWT filter rejects them. */
    @Transactional
    public users banUser(Long id) {
        users user = getUserById(id);
        user.setEnabled(false);
        return usersRepository.save(user);
    }
 
    /** Unban a user. */
    @Transactional
    public users unbanUser(Long id) {
        users user = getUserById(id);
        user.setEnabled(true);
        return usersRepository.save(user);
    }
 
    /** All students paginated. */
    public Page<users> getAllStudents(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return usersRepository.findByAccountType(AccountType.STUDENT, pageable);
    }
 
    /** All teachers paginated. */
    public Page<users> getAllTeachers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return usersRepository.findByAccountType(AccountType.TEACHER, pageable);
    }
 
    
    //  COURSES
    
 
    /** All courses (published + unpublished) paginated. */
    public Page<Courses> getAllCourses(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return courseRepository.findAll(pageable);
    }
 
    /** Force delete any course. */
    @Transactional
    public void forceDeleteCourse(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new IllegalStateException("Course not found: " + courseId);
        }
        courseRepository.deleteById(courseId);
    }
 
    /** Hide a course that violates rules. */
    @Transactional
    public Courses unpublishCourse(Long courseId) {
        Courses course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalStateException("Course not found: " + courseId));
        course.setPublished(false);
        return courseRepository.save(course);
    }
 
    
    //  SUBJECTS
     
    public List<subjects> getAllSubjects() {
        return subjectRepository.findAll();
    }

    public subjects createSubject(subjects subject) {
        if (subject.getName() == null || subject.getName().isBlank()) {
            throw new IllegalArgumentException("Subject name is required");
        }
        return subjectRepository.save(subject);
    }
 
    @Transactional
    public subjects renameSubject(Long id, String newName) {
        subjects subject = subjectRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Subject not found: " + id));
        if (newName == null || newName.isBlank()) {
            throw new IllegalArgumentException("Subject name cannot be empty");
        }
        subject.setName(newName.trim());
        return subjectRepository.save(subject);
    }
 
    public List<Years> getAllAdminYears() {
        return yearRepository.findAll();
    }

     
    //  STREAMS
     
   
    public List<Streams> getAllStreams() {
        return streamRepository.findAll();
    }

    public Streams createStream(Streams stream) {
        return streamRepository.save(stream);
    }
 
    
    //  BADGES
    
 
    public List<Badges> getAllBadges() {
        return badgeRepository.findAll();
    }
 
    @Transactional
    public Badges createBadge(Badges badge) {
        if (badge.getCode() == null || badge.getCode().isBlank()) {
            throw new IllegalArgumentException("Badge code is required");
        }
        if (badgeRepository.findByCode(badge.getCode()).isPresent()) {
            throw new IllegalStateException("Badge with code '" + badge.getCode() + "' already exists");
        }
        if (badge.getBonusPoints() == null) badge.setBonusPoints(0);
        return badgeRepository.save(badge);
    }
 
    @Transactional
    public Badges updateBadge(Long id, Badges updated) {
        Badges existing = badgeRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Badge not found: " + id));
 
        if (updated.getName() != null && !updated.getName().isBlank()) {
            existing.setName(updated.getName().trim());
        }
        if (updated.getDescription() != null) {
            existing.setDescription(updated.getDescription().trim());
        }
        if (updated.getBonusPoints() != null) {
            existing.setBonusPoints(updated.getBonusPoints());
        }
        if (updated.getIconUrl() != null) {
            existing.setIconUrl(updated.getIconUrl().trim());
        }
        if (updated.getTier() != null) {
            existing.setTier(updated.getTier());
        }
        return badgeRepository.save(existing);
    }
 
    @Transactional
    public void deleteBadge(Long id) {
        if (!badgeRepository.existsById(id)) {
            throw new IllegalStateException("Badge not found: " + id);
        }
        badgeRepository.deleteById(id);
    }
}
