package com.educationonline.backend.services;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.stream.Stream;
import com.educationonline.backend.dtos.LessonDto;
import com.educationonline.backend.dtos.search.LessonResourceHitDto;
import com.educationonline.backend.entities.*;
import com.educationonline.backend.mappers.LessonMapper;
import com.educationonline.backend.repositories.*;

@Getter
@Setter
@AllArgsConstructor
@Service
public class LessonsService {

    private final StudentBadgeRepository studentBadgeRepository;
    private final LessonRepository lessonsRepository;
    private final CourseRepository courseRepository;
    private final teachersRepository teachersRepository;
    private final ProgressRepository progressRepository;
    private final BadgeEngineService badgeEngine;
    private final studentRepository studentRepository;
    private final ProgressService progressService;
    private final PointsService pointsService;


   


   @Transactional
public LessonDto createLesson(LessonDto dto) {
    if (dto.getTitle() == null || dto.getTitle().isEmpty()) {
        throw new IllegalArgumentException("Lesson title is required");
    }

    Lessons lesson = LessonMapper.toEntity(dto);

    // set teacher
    if (dto.getTeacherId() != null) {
        teachers teacher = teachersRepository.findById(dto.getTeacherId())
            .orElseThrow(() -> new IllegalArgumentException("Teacher not found"));
        lesson.setTeacher(teacher);
    }

    // ← FULL null check — getCourses() AND getId() both checked
    if (lesson.getCourses() != null && lesson.getCourses().getId() != null) {
        Optional<Lessons> lastLesson = lessonsRepository
            .findTopByCoursesIdOrderByOrderNumberDesc(lesson.getCourses().getId());
        lesson.setOrderNumber(lastLesson.map(l -> l.getOrderNumber() + 1).orElse(1));
    } else {
        lesson.setOrderNumber(1);
    }

    // validate resource
    if (lesson.getResource() == null) {
        throw new IllegalArgumentException("At least one Resource URL is required");
    }
    boolean hasVideo = lesson.getResource().getVideoUrl() != null
                    && !lesson.getResource().getVideoUrl().isEmpty();
    boolean hasPdf   = lesson.getResource().getPdfUrl()   != null
                    && !lesson.getResource().getPdfUrl().isEmpty();
    if (!hasVideo && !hasPdf) {
        throw new IllegalArgumentException("At least one Resource URL is required");
    }

    Lessons saved = lessonsRepository.save(lesson);
    return LessonMapper.toDto(saved);
}



@Transactional
public void completeLesson(Long studentId, Long lessonId) {

    // 1. mark progress (whatever your system uses)
    progressService.markLessonCompleted(studentId, lessonId);

    // 2. check FIRST_LESSON badge
    long totalCompleted = progressService.countCompletedLessons(studentId);

    pointsService.addPoints(studentId, 10, "LESSON_COMPLETED");
    if (totalCompleted == 1) {
        badgeEngine.handleEvent(
            studentId,
            BadgeEventType.LESSON_COMPLETED,
            Map.of("lessonId", lessonId, "first", true)
        );
    } else {
        badgeEngine.handleEvent(
            studentId,
            BadgeEventType.LESSON_COMPLETED,
            Map.of("lessonId", lessonId, "first", false)
        );
    }
}
    @Transactional
    public List<LessonDto> getLessonsByTeacherId(Long teacherId) {
        
         List<Lessons> result = new java.util.ArrayList<>();

    // get independent lessons
    try {
        result.addAll(lessonsRepository.findDirectLessonsByTeacherId(teacherId));
    } catch (Exception e) {
        System.out.println("findDirectLessons error: " + e.getMessage());
    }

    // get course lessons
    try {
        result.addAll(lessonsRepository.findCourseLessonsByTeacherId(teacherId));
    } catch (Exception e) {
        System.out.println("findCourseLessons error: " + e.getMessage());
    }

    return result.stream()
        .filter(l -> l != null && l.getId() != null)
        .distinct()
        .map(LessonMapper::toDto)
        .collect(java.util.stream.Collectors.toList());    }

    @Transactional
    public LessonDto updateLesson(Long courseId, Long lessonId, LessonDto updatedLesson) {
        Lessons existingLesson = lessonsRepository.findById(lessonId)
                .orElseThrow(() -> new IllegalArgumentException("Lesson not found with id "));

        if (updatedLesson.getTitle() != null && !updatedLesson.getTitle().isEmpty()) {
            existingLesson.setTitle(updatedLesson.getTitle().trim());
        }
        if (updatedLesson.getContent() != null) {
            existingLesson.setContent(updatedLesson.getContent().trim());
        }
        
      if (updatedLesson.getResource() != null) {
        if (existingLesson.getResource() == null) {
            existingLesson.setResource(new Ressources());
        }
        boolean hasVideo = updatedLesson.getResource().getVideoUrl() != null
                        && !updatedLesson.getResource().getVideoUrl().isBlank();
        boolean hasPdf   = updatedLesson.getResource().getPdfUrl()   != null
                        && !updatedLesson.getResource().getPdfUrl().isBlank();
        if (!hasVideo && !hasPdf) {
            throw new IllegalArgumentException("At least one Resource URL is required");
        }
        if (hasVideo) existingLesson.getResource().setVideoUrl(updatedLesson.getResource().getVideoUrl().trim());
        if (hasPdf)   existingLesson.getResource().setPdfUrl(updatedLesson.getResource().getPdfUrl().trim());
    }
        

            if (updatedLesson.getCourseId() != null) {
                if(updatedLesson.getCourseId() == 0){
                    existingLesson.setCourses(null); //OPEN lesson
                }else{
                Courses course = courseRepository.findById(updatedLesson.getCourseId()).orElseThrow(()-> new RuntimeException("Course not found"));
                existingLesson.setCourses(course);
                if (existingLesson.getTeacher() == null) {
                    existingLesson.setTeacher(course.getTeacher());
                }
                Optional<Lessons> lastLesson = lessonsRepository
                        .findTopByCoursesIdOrderByOrderNumberDesc(course.getId());
                if (existingLesson.getOrderNumber() == null || existingLesson.getOrderNumber() <= 0) {
                    existingLesson.setOrderNumber(lastLesson
                            .filter(l -> !l.getId().equals(existingLesson.getId()))
                            .map(l -> l.getOrderNumber() + 1)
                            .orElse(1));
                }
            }
            }

            Lessons saved = lessonsRepository.save(existingLesson);
        return LessonMapper.toDto(saved);
    }

    @Transactional
    public void deleteLessons(Long lessonId){

        Lessons dLesson = lessonsRepository.findById(lessonId)
           .orElseThrow(() -> new IllegalArgumentException("Lesson not found with id: "+ lessonId ));

        lessonsRepository.delete(dLesson);
    }

    public LessonDto getLessonById(Long id) {
        
        Lessons lesson = lessonsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lesson not found with id: " + id));

        return LessonMapper.toDto(lesson);
    }

    public List<LessonDto> getLessonsByCourseId(Long courseId) {

                courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found with id: " + courseId));

                List<Lessons> lessons = lessonsRepository.findByCoursesId(courseId);
               
                return lessons.stream().map(LessonMapper::toDto).toList();
    }

    public LessonDto getLessonByCourse(Long courseId, Long lessonId) {
        courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found with id: " + courseId));

                Lessons lesson = lessonsRepository.findByIdAndCoursesId(lessonId, courseId)
                .orElseThrow(() -> new IllegalArgumentException("Lesson not found with id"));
        
                return LessonMapper.toDto(lesson);
    }

    

    public List<LessonResourceHitDto> searchLessons(String query) {

        String rawQuery = query != null ? query.trim() : "";
        if ( rawQuery.isEmpty()) {
            throw new IllegalArgumentException("No result with query: " + rawQuery);
        }

        int max = 50;
        return lessonsRepository.searchPublishedLessonsByTitleOrContent(rawQuery)
        .stream().map(this::toLessonHit).limit(max)
        .toList();
    }

    // to convert a Lessons entity to a LessonResourceHitDto for search results
    private LessonResourceHitDto toLessonHit(Lessons l) {
        Courses c = l.getCourses();
        Long courseId = c != null ? c.getId() : null;
        String courseTitle = c != null ? c.getTitle() : "";
        Long tid = null;
        String tname = "";
        if (c != null && c.getTeacher() != null) {
            tid = c.getTeacher().getId();
            if (c.getTeacher().getUserT() != null) {
                tname = Objects.toString(c.getTeacher().getUserT().getName(), "");
            }
        }
        Ressources res = l.getResource();
        String video = res != null ? res.getVideoUrl() : null;
        String pdf = res != null ? res.getPdfUrl() : null;
        long lid = l.getId();
        return new LessonResourceHitDto(
                lid,
                l.getTitle(),
                courseId,
                courseTitle,
                tid,
                tname,
                video,
                pdf,
                courseId != null ? "/courses/" + courseId + "/lessons/" + lid : null,
                courseId != null ? "/courses/" + courseId : null);
    }
}

