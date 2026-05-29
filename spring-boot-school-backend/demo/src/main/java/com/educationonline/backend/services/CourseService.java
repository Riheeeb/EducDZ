package com.educationonline.backend.services;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import jakarta.persistence.criteria.Predicate;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.educationonline.backend.dtos.CourseDto;
import com.educationonline.backend.dtos.StreamDto;
import com.educationonline.backend.dtos.SubstreamDto;
import com.educationonline.backend.dtos.TeacherCourseDTO;
import com.educationonline.backend.dtos.TeacherCourseOptionDto;
import com.educationonline.backend.dtos.TeacherPublicCourses;
import com.educationonline.backend.dtos.profiles.StudentProfileDto;
import com.educationonline.backend.entities.BadgeEventType;
import com.educationonline.backend.entities.Courses;
import com.educationonline.backend.entities.Enrollment;
import com.educationonline.backend.entities.Streams;
import com.educationonline.backend.entities.StudentLevel;
import com.educationonline.backend.entities.students;
import com.educationonline.backend.entities.subjects;
import com.educationonline.backend.entities.substream;
import com.educationonline.backend.entities.teachers;
import com.educationonline.backend.mappers.CourseMapper;
import com.educationonline.backend.mappers.LessonMapper;
import com.educationonline.backend.mappers.StreamMapper;
import com.educationonline.backend.mappers.SubstreamMapper;
import com.educationonline.backend.mappers.YearMapper;
import com.educationonline.backend.repositories.*;
import com.educationonline.backend.entities.Years;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor


@Service
public class CourseService {

    private final StreamRepository streamRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final studentRepository studentRepository;
    private final teachersRepository teachersRepository;
    private final substreamRepository substreamRepository;
    private final yearRepo yearRepo;
    private final BadgeEngineService BadgeEngineService;
    private final PointsService pointsService;
    private final NotificationService notificationService;

    
    /*        TEACHER DASHBOARD 
         - createCourse()
         - updateCourse()
         - publishCourse()          validates course has lessons before publishing
         - unpublishCourse()
         - deleteCourse()
         - getCourseStudents()      list of enrolled students
         - getCourseStats()         total enrolled, avg progress, completed count
 
     */
    @Transactional
    public CourseDto createCourse(CourseDto course) {
        

        Courses newcourse = CourseMapper.toEntity(course);

// set year enum from yearId
if (course.getYearId() != null) {
    Years year = yearRepo.findById(course.getYearId())
        .orElseThrow(() -> new IllegalArgumentException("Year not found: " + course.getYearId()));
    newcourse.setYear(year.getYear()); 
}


         if (newcourse.getSubject() == null && newcourse.getTeacher() != null) {
             teachers teacher = teachersRepository.findById(newcourse.getTeacher().getId())
            .orElseThrow(() -> new IllegalStateException("Teacher not found"));

            if (teacher.getSubject().getId() != null) {
            subjects subject = new subjects();
            subject.setId(teacher.getSubject().getId());
            newcourse.setSubject(subject);
            }

        System.out.println("Set subject from teacher: " + teacher.getSubject().getId());

      }
        newcourse.setPublished(false); // course created but still not visible to students
        Courses saved = courseRepository.save(newcourse);
        return toCourseDto(saved);

    }

    @Transactional
    public CourseDto publishCourse(Long courseId) {
        Courses course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalStateException("Course not found"));
        if (lessonRepository.countByCoursesId(courseId) == 0) {
            throw new IllegalStateException("Cannot publish course without lessons");
        }
        course.setPublished(true);

        Courses saved = courseRepository.save(course);
        return toCourseDto(saved);
    }

    @Transactional // hide course but not delete it
    public CourseDto unpublishCourse(Long courseId) {
        Courses course =courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalStateException("Course not found"));
        long activeEnrollments = enrollmentRepository.countByCourses_IdAndStatus(
                courseId, Enrollment.EnrollmentStatus.ACTIVE);
        if (activeEnrollments > 0) {
            throw new IllegalStateException("Cannot unpublish a course while students are actively enrolled.");
        }
        course.setPublished(false);

        Courses saved = courseRepository.save(course);
        return toCourseDto(saved);
    }

    @Transactional
    public CourseDto updateCourse(Long courseId, CourseDto updatedCourse) {
        Courses course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalStateException("Course not found"));
        if (updatedCourse.getTitle() != null) {
            course.setTitle(updatedCourse.getTitle());
        }
          if (updatedCourse.getDescription()!=null) {
            course.setDescription(updatedCourse.getDescription());
          }   
          
          if (updatedCourse.getStudentLevel() != null) {
            course.setStudentLevel(
                StudentLevel.valueOf(updatedCourse.getStudentLevel())
        );
          }
        if (updatedCourse.getYearId() != null) {
    Years year = yearRepo.findById(updatedCourse.getYearId())
        .orElseThrow(() -> new RuntimeException("Year not found"));

course.setYear(year.getYear());
        
    }

    if (course.getStudentLevel() == StudentLevel.MIDDLE_SCHOOL) {
        course.setStream(null);
        course.setSubstream(null);
    } else {
        if (updatedCourse.getStreamId() != null) {
            Streams stream = streamRepository.findById(updatedCourse.getStreamId())
                    .orElseThrow(() -> new RuntimeException("Stream not found"));
            course.setStream(stream);
        }

        if (updatedCourse.getSubstreamId() != null) {
            substream sub = substreamRepository.findById(updatedCourse.getSubstreamId())
                    .orElseThrow(() -> new RuntimeException("Substream not found"));
            course.setSubstream(sub);
        }
    }
        Courses saved = courseRepository.save(course);
        return toCourseDto(saved);
    }

     @Transactional
    public void deleteCourse(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new IllegalStateException("Course not found " );
        }
        courseRepository.deleteById(courseId);
    }

    public List<Enrollment> getAllStudentsInCourse(Long courseId) {
        return enrollmentRepository.findByCoursesId(courseId);
    }
/* 
public CourseStatsDTO getCourseStats(Long courseId) {
        List<Enrollment> enrollments = enrollmentRepository.findByCoursesId(courseId);
        long total     = enrollments.size();
        long completed = enrollments.stream()
                .filter(e -> e.getStatus() == Enrollment.EnrollmentStatus.COMPLETED).count();
        double avg     = enrollments.stream()
                .mapToInt(Enrollment::getProgressPercent).average().orElse(0);
        return new CourseStatsDTO(total, completed, avg);
    }
 */

    public CourseDto getCourseById(Long courseId) {
        Courses course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalStateException("Course not found"));
        return toCourseDto(course);
    }

    /** Published course only; used by public search / course view. */
    public CourseDto getPublishedCourseById(Long courseId) {

        Courses course = courseRepository.findByPublishedTrueAndId(courseId);
        return toCourseDto(course);
    }

    public List<CourseDto> getAllCoursesByTeacherId(Long teacherId) {

        List<Courses> courses = courseRepository.findByTeacherId(teacherId);
        return courses.stream().map(this::toCourseDto).toList();
    }

    public Long countCoursesByTeacherId(Long teacherId) {
        return courseRepository.countByTeacherId(teacherId);
    }

    /* ORGANIZED LEARNING + OPEN LEARNING - Student Dashboard
      - enrollStudent()          student subscribes to a course
      - getEnrolledCourses()     All courses a student is enrolled in
      - getCourseProgress()      enrollment + lesson progress details
      - completeCourse()         
      - dropCourse()   
     */
     
      @Transactional
      public Enrollment enrollStudent(Long studentId, Long courseId) {
        if (!studentRepository.existsById(studentId)) {
            throw new IllegalStateException("Student not found");
        }

        Courses course = courseRepository.findByPublishedTrueAndId(courseId);
        if (course == null) {
            throw new IllegalStateException("Course not found or not published");
        }

        var existing = enrollmentRepository.findByStudentIdAndCoursesId(studentId, courseId);
        if (existing.isPresent()) {
            Enrollment enrollment = existing.get();
            if (enrollment.getStatus() == Enrollment.EnrollmentStatus.DROPPED) {
                enrollment.setStatus(Enrollment.EnrollmentStatus.ACTIVE);
                enrollment.setDroppedAt(null);
                enrollment.setDropCount((enrollment.getDropCount() == null ? 0 : enrollment.getDropCount()) + 1);
                enrollment.setLastAccessedAt(LocalDateTime.now());
                Enrollment saved = enrollmentRepository.save(enrollment);
                notificationService.notifyEnrollment(course, studentRepository.findById(studentId)
                        .orElseThrow(() -> new IllegalStateException("Student not found")));
                return saved;
            }
            return enrollment;
        }
        
        students student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalStateException("Student not found"));

        Enrollment saved = enrollmentRepository.save(Enrollment.builder()
                .student(student)
                .courses(course)
                .progressPercent(0)
                .pointsEarned(0)
                .status(Enrollment.EnrollmentStatus.ACTIVE)
                .lastAccessedAt(LocalDateTime.now())
                .build());
        notificationService.notifyEnrollment(course, student);
        return saved;
    }

    //All enroled courses for a student
    public List<Enrollment> getEnrolledCourses(Long studentId) { 
        return enrollmentRepository.findByStudentId(studentId);
    }

    //get progress details for a specific course only if enrolled
    public Enrollment getCourseProgress(Long studentId, Long courseId) {
        return enrollmentRepository.findByStudentIdAndCoursesId(studentId, courseId)
                .orElseThrow(() -> new IllegalStateException(
                        "No enrollment found for student " + studentId + " in course " + courseId));
    }

     @Transactional
    public Enrollment completeCourse(Long studentId, Long courseId) {
        Enrollment enrollment = getCourseProgress(studentId, courseId);
        if (enrollment.getStatus() == Enrollment.EnrollmentStatus.COMPLETED) return enrollment; // idempotent
        enrollment.setStatus(Enrollment.EnrollmentStatus.COMPLETED);
        enrollment.setProgressPercent(100);
        enrollment.setCompletedAt(LocalDateTime.now());
        pointsService.addPoints(studentId, 50, "COURSE_COMPLETED");
        BadgeEngineService.handleEvent(
    studentId,
    BadgeEventType.COURSE_COMPLETED,
    Map.of("courseId", courseId)
);
        return enrollmentRepository.save(enrollment);
    }

    @Transactional
    public void dropCourse(Long studentId, Long courseId) {
        Enrollment enrollment = getCourseProgress(studentId, courseId);
        enrollment.setStatus(Enrollment.EnrollmentStatus.DROPPED);
        enrollmentRepository.save(enrollment);
    }
/* 
    @Transactional
public Enrollment reEnroll(Long studentId, Long courseId, boolean continueProgress) {

    Enrollment existing = getCourseProgress(studentId, courseId);

    if (existing.getStatus() != Enrollment.EnrollmentStatus.DROPPED) {
        throw new IllegalStateException("Student is not dropped from this course.");
    }

    // Option 1 — continue from where they stopped
    existing.setStatus(Enrollment.EnrollmentStatus.ACTIVE);
    existing.setDroppedAt(null);
    existing.setDropCount(existing.getDropCount() + 1);

    if (continueProgress) {
    
    // record when they came back
    existing.setLastAccessedAt(LocalDateTime.now());

    // 2. recalculate progress percent based on actual completed lessons(in case lessons were added to the course while they were dropped)
    long totalLessons     = lessonRepository.countByCoursesId(courseId);
    long completedLessons = existing.getLessonProgresses()
            .stream()
            .filter(LessonProgress::getCompleted)
            .count();

    int recalculatedPercent = totalLessons == 0 ? 0
            : (int) ((completedLessons * 100) / totalLessons);

    existing.setProgressPercent(recalculatedPercent);

    // 3. keep all lesson progress exactly as it was —
    //    completed lessons stay completed,
    //    video positions are preserved so student resumes where they paused
    //    nothing else to change h
    }else{
    

    
    
     existing.setProgressPercent(0);
     existing.setPointsEarned(0);
      existing.setCompletedAt(null);}
    return enrollmentRepository.save(existing);
}*/
public List<Courses> getCourseByStream(Long streamId){

    return courseRepository.findByPublishedTrueAndStreamId(streamId);
}

public List<Courses> getCourseBySubject(Long subjectId){
    return courseRepository.findByPublishedTrueAndSubjectId(subjectId);
}

public List<Courses> getCourseByYear(String year){
    Streams stream = streamRepository.findByYear(year)
            .stream()
            .findFirst()
            .orElseThrow(() -> new IllegalStateException("Stream not found for year: " + year));
    return courseRepository.findByPublishedTrueAndStreamId(stream.getId());
}

public Page<CourseDto> getAllPublishedCourses(int page, int size) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
    
    Page<Courses> courses = courseRepository.findByPublishedTrue(pageable);
    return courses.map(this::toCourseDto);
}
// related with the endpoint /teachers/{teacherId}/courses?page=&size= to get only published courses with pagination for the student dashboard
@Transactional
public TeacherPublicCourses getPublishedCoursesByTeacher(Long teacherId, int page, int size) {
    teachersRepository.findById(teacherId)
        .orElseThrow(() -> new IllegalStateException("Teacher not found"));

    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
    Page<Courses> coursePage = courseRepository.findByTeacherIdAndPublishedTrue(teacherId, pageable);
    
     Page<TeacherCourseDTO> dtoPage = coursePage.map(c -> {
        // Convert StudentLevel enum to String
        String studentLevelStr = c.getStudentLevel() != null 
            ? c.getStudentLevel().name()  
            : null;
            
        return new TeacherCourseDTO(
            c.getId(),
            c.getTitle(),
            c.getDescription(),
            studentLevelStr,              
            c.getYear() != null ? c.getYear().getValue() : null,
            c.getStream() != null ? c.getStream().getStreamType().getNamestream() : null,
            c.getSubstream() != null ? c.getSubstream().getNameSubstream() : null,
            c.isPublished(),
            c.getTeacher() != null ? c.getTeacher().getUserT().getName() : "Teacher",
            c.getCreatedAt() != null ? c.getCreatedAt().toString() : "",
            c.getLesson() != null ? c.getLesson().size() : 0,
            c.getEnrollments() != null ? c.getEnrollments().size() : 0
        );
    });
    
    return new TeacherPublicCourses(dtoPage);
}

    //FOR CREATION COURSES OPTIONS
    /* 
    public List<YearDto> getByStudentLevel(StudentLevel level) {

    List<Years> years =yearRepo.findByYearType(level);
        return years
            .stream()
            .map(YearMapper::toDto)
            .toList();
}*/

public List<StreamDto> getStreamsByYear(Long yearId){
    List<Streams> streams = streamRepository.findByYearId(yearId);

    return streams.stream().map(StreamMapper::toDto).toList();
}

public List<SubstreamDto> getSubstream(Long yearId, Long streamId){
    List<substream> substreams = substreamRepository.findByStreamsId( streamId);

    return substreams.stream().map(SubstreamMapper::toDto).toList();
}


public List<TeacherCourseOptionDto> getTeacherCourseOptions(Long teacherId) {

    return courseRepository.findByTeacherId(teacherId)
            .stream()
            .map(c -> new TeacherCourseOptionDto(
                    c.getId(),
                    c.getTitle()
            ))
            .toList();
}




public StudentProfileDto getStudentProfile(Long studentId) {
    students student = studentRepository.findById(studentId)
            .orElseThrow(() -> new IllegalStateException("Student not found"));

    Streams stream = student.getStreams();

    return new StudentProfileDto(
            student.getStudentLevel(),
            stream != null ? stream.getId() : null,
            stream != null && stream.getYear() != null ? stream.getYear().getId() : null,
            student.getSubstream() != null ? student.getSubstream().getId() : null
    );
            
}
public Page<CourseDto> getPopularCourses(Long studentId, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);

    studentRepository.findById(studentId)
            .orElseThrow(() -> new IllegalStateException("Student not found"));

    Page<Courses> courses = courseRepository.findPopularCourses(pageable);
    return courses.map(this::toCourseDto);


}

public Page<CourseDto> getRecomendedCourses(Long studentId, int page, int size) {
    
    studentRepository.findById(studentId)
            .orElseThrow(() -> new IllegalStateException("Student not found"));
    Pageable pageable = PageRequest.of(page, size);
    StudentProfileDto profile = getStudentProfile(studentId);
    if (profile.studentLevel() == null) {
        return Page.empty(pageable);
    }

    // High school: filter by stream + year + substream
    if (profile.streamId() != null && profile.yearId() != null) {
        return courseRepository.findRecomendedCourses(
            profile.studentLevel(),
            profile.streamId(),
            profile.yearId(),
            profile.substreamId(),
            studentId,
            pageable
        ).map(this::toCourseDto);
    }

    // Middle school: filter by year from enrollments + substream (no stream)
    Years.yearValue studentYear = findStudentYearFromEnrollments(studentId);
    if (studentYear == null) {
        return Page.empty(pageable);
    }
    return courseRepository.findRecomendedCoursesMiddleSchool(
        profile.studentLevel(),
        studentYear,
        profile.substreamId(),
        studentId,
        pageable
    ).map(this::toCourseDto);
}

private Years.yearValue findStudentYearFromEnrollments(Long studentId) {
    List<Enrollment> enrollments = enrollmentRepository.findByStudentId(studentId);
    return enrollments.stream()
        .map(e -> e.getCourses())
        .filter(Objects::nonNull)
        .map(Courses::getYear)
        .filter(Objects::nonNull)
        .findFirst()
        .orElse(null);
}

public Page<CourseDto> getLatestCourses( Long studentId, int page, int size) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

    studentRepository.findById(studentId)
            .orElseThrow(() -> new IllegalStateException("Student not found"));

    LocalDateTime since = LocalDateTime.now().minusDays(5);
    return courseRepository.findLatestCoursesSince(since, pageable)
            .map(this::toCourseDto);
}

/** Optional filters; all-null returns all published (paged like catalog). */
public Page<CourseDto> discoverPublishedCourses(Long streamId, Long subjectId, Long yearTableId,
        int page, int size) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

    Years.yearValue yearFromPicker = yearTableId == null ? null
            : yearRepo.findById(yearTableId).map(Years::getYear).orElse(null);

    Years.yearValue yearFromStream = streamId == null ? null
            : streamRepository.findById(streamId)
                    .map(Streams::getYear)
                    .map(Years::getYear)
                    .orElse(null);

    final Years.yearValue yearFilter = yearFromPicker != null ? yearFromPicker : yearFromStream;

    Specification<Courses> spec = (root, query, cb) -> {
        List<Predicate> parts = new ArrayList<>();
        parts.add(cb.isTrue(root.get("published")));

        if (subjectId != null) {
            parts.add(cb.equal(root.get("subject").get("id"), subjectId));
        }

        if (streamId != null) {
            if (yearFilter != null) {
                Predicate matchStream = cb.equal(root.get("stream").get("id"), streamId);
                Predicate middleNoStream = cb.and(
                        cb.isNull(root.get("stream")),
                        cb.equal(root.get("year"), yearFilter),
                        cb.equal(root.get("studentLevel"), StudentLevel.MIDDLE_SCHOOL));
                parts.add(cb.or(matchStream, middleNoStream));
            } else {
                parts.add(cb.equal(root.get("stream").get("id"), streamId));
            }
        } else if (yearFilter != null) {
            parts.add(cb.equal(root.get("year"), yearFilter));
        }

        query.distinct(true);
        return cb.and(parts.toArray(Predicate[]::new));
    };

    return courseRepository.findAll(spec, pageable).map(this::toCourseDto);
}

private CourseDto toCourseDto(Courses course) {
    CourseDto dto = CourseMapper.toDto(course);

    if (course == null || dto == null || course.getYear() == null) {
        return dto;
    }

    yearRepo.findByYear(course.getYear())
            .map(Years::getId)
            .ifPresent(dto::setYearId);

    return dto;
}


}
