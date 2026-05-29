package com.educationonline.backend.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.educationonline.backend.dtos.search.CourseLinkDto;
import com.educationonline.backend.dtos.search.CourseSearchCardDto;
import com.educationonline.backend.dtos.search.GlobalSearchResponse;
import com.educationonline.backend.dtos.search.LessonResourceHitDto;
import com.educationonline.backend.dtos.search.MediaItemDto;
import com.educationonline.backend.dtos.search.TeacherSearchCardDto;
import com.educationonline.backend.entities.Courses;
import com.educationonline.backend.entities.Lessons;
import com.educationonline.backend.entities.Ressources;
import com.educationonline.backend.entities.teachers;
import com.educationonline.backend.repositories.CourseRepository;
import com.educationonline.backend.repositories.LessonRepository;
import com.educationonline.backend.repositories.teachersRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SearchService {

    private static final String API_BASE = "/api/v1";

    private final teachersRepository teachersRepository;
    private final CourseRepository courseRepository;
    private final LessonRepository lessonRepository;

    @Transactional(readOnly = true)
    public GlobalSearchResponse search(String rawQuery, int limitPerSection) {
        int cap = Math.min(Math.max(limitPerSection, 1), 50);
        String q = rawQuery == null ? "" : rawQuery.trim();
        if (q.isEmpty()) {
            return new GlobalSearchResponse("", List.of(), List.of(), List.of());
        }

        List<TeacherSearchCardDto> teachers = teachersRepository.searchByUserNameContaining(q).stream()
                .map(this::toTeacherCard)
                .limit(cap)
                .toList();

        List<CourseSearchCardDto> courses = courseRepository.searchPublishedByTitleOrDescription(q).stream()
                .map(this::toCourseCard)
                .limit(cap)
                .toList();

        List<LessonResourceHitDto> lessonHits = lessonRepository.searchPublishedLessonsByTitleOrContent(q).stream()
                .map(this::toLessonHit)
                .limit(cap)
                .toList();

        return new GlobalSearchResponse(q, teachers, courses, lessonHits);
    }

    private TeacherSearchCardDto toTeacherCard(teachers t) {
        String name = t.getUserT() != null ? t.getUserT().getName() : "";
        List<Courses> published = courseRepository.findPublishedByTeacherIdWithLessonsAndResources(t.getId());
        List<CourseLinkDto> courseLinks = published.stream()
                .map(c -> courseLink(c.getId(), c.getTitle()))
                .toList();

        List<MediaItemDto> videos = new ArrayList<>();
        List<MediaItemDto> docs = new ArrayList<>();
        for (Courses c : published) {
            if (c.getLesson() == null) {
                continue;
            }
            for (Lessons lesson : c.getLesson()) {
                Ressources res = lesson.getResource();
                if (res == null) {
                    continue;
                }
                if (notBlank(res.getVideoUrl())) {
                    videos.add(new MediaItemDto(
                            lesson.getId(),
                            lesson.getTitle(),
                            c.getId(),
                            c.getTitle(),
                            res.getVideoUrl()));
                }
                if (notBlank(res.getPdfUrl())) {
                    docs.add(new MediaItemDto(
                            lesson.getId(),
                            lesson.getTitle(),
                            c.getId(),
                            c.getTitle(),
                            res.getPdfUrl()));
                }
            }
        }

        return new TeacherSearchCardDto(
                t.getId(),
                name,
                published.size(),
                courseLinks,
                videos.size(),
                videos,
                docs.size(),
                docs,
                API_BASE + "/teachers/" + t.getId() + "/courses");
    }

    private CourseSearchCardDto toCourseCard(Courses c) {
        Long tid = c.getTeacher() != null ? c.getTeacher().getId() : null;
        String tname = "";
        if (c.getTeacher() != null && c.getTeacher().getUserT() != null) {
            tname = Objects.toString(c.getTeacher().getUserT().getName(), "");
        }
        long cid = c.getId();
        return new CourseSearchCardDto(
                cid,
                c.getTitle(),
                tid,
                tname,
                "/courses/" + cid,
                API_BASE + "/courses/" + cid,
                tid != null ? API_BASE + "/teachers/" + tid + "/courses" : null,
                tid != null ? "/teachers/" + tid + "/courses" : null);
    }

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
        } else if (l.getTeacher() != null) {
            tid = l.getTeacher().getId();
            if (l.getTeacher().getUserT() != null) {
                tname = Objects.toString(l.getTeacher().getUserT().getName(), "");
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
                courseId != null ? "/courses/" + courseId + "/lessons/" + lid : "/lessons/" + lid,
                courseId != null ? "/courses/" + courseId : null);
    }

    private CourseLinkDto courseLink(long courseId, String title) {
        return new CourseLinkDto(
                courseId,
                title,
                "/courses/" + courseId,
                API_BASE + "/courses/" + courseId);
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
