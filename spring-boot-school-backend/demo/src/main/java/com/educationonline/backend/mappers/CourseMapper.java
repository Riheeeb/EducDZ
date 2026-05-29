package com.educationonline.backend.mappers;

import com.educationonline.backend.dtos.CourseDto;
import com.educationonline.backend.dtos.CourseDto.TeacherSummaryDto;
import com.educationonline.backend.dtos.LessonDto;
import com.educationonline.backend.entities.*;
import com.educationonline.backend.entities.Years.yearValue;
import com.educationonline.backend.repositories.yearRepo;

import java.util.List;

public class CourseMapper {

    Years years = new Years();
    

   public static CourseDto toDto(Courses course) {
    if (course == null) return null;

    TeacherSummaryDto teacherDto = null;
    if (course.getTeacher() != null && course.getTeacher().getUserT() != null) {
        teacherDto = new TeacherSummaryDto(
            course.getTeacher().getId(),
            course.getTeacher().getUserT().getName()
        );
    }

    List<LessonDto> lessonsDto = course.getLesson() != null
        ? course.getLesson().stream().map(LessonMapper::toDto).toList()
        : null;

    return new CourseDto(
        course.getId(),
        course.getTitle(),
        course.getDescription(),
        course.getPublished(),
        course.getCreatedAt() != null ? course.getCreatedAt().toString() : null,

        // studentLevel
        course.getStudentLevel() != null ? course.getStudentLevel().name() : null,

        // yearId → null (enum has no separate id)
        null,
        course.getStream()    != null ? course.getStream().getId()    : null,
        course.getSubstream() != null ? course.getSubstream().getId() : null,
        course.getSubject()   != null ? course.getSubject().getId()   : null,
        course.getTeacher()   != null ? course.getTeacher().getId()   : null,

        // yearName ← use getValue() on the enum → "3AS", "2AM" etc
        course.getYear() != null ? course.getYear().getValue() : null,

        // streamName
        course.getStream() != null && course.getStream().getStreamType() != null
            ? course.getStream().getStreamType().getNamestream() : null,

        // substreamName
        course.getSubstream() != null
            ? course.getSubstream().getNameSubstream() : null,

        course.getSubject() != null ? course.getSubject().getName() : null,

        teacherDto,
        lessonsDto,
        course.getLesson()      != null ? (long) course.getLesson().size()      : 0L,
        course.getQuizes()      != null ? (long) course.getQuizes().size()      : 0L,
        course.getEnrollments() != null ? (long) course.getEnrollments().size() : 0L
    );
}

    
    public static Courses toEntity(CourseDto dto) {
        if (dto == null) return null;

        Courses course = new Courses();

        course.setId(dto.getId());
        course.setTitle(dto.getTitle());
        course.setDescription(dto.getDescription());
        course.setPublished(dto.getPublished() != null ? dto.getPublished() : false);

        // studentLevel enum
        if (dto.getStudentLevel() != null) {
            course.setStudentLevel(StudentLevel.valueOf(dto.getStudentLevel()));
        }


        // teacher
        if (dto.getTeacherId() != null) {
            teachers teacher = new teachers();
            teacher.setId(dto.getTeacherId());
            course.setTeacher(teacher);
        }

        // subject
        if (dto.getSubjectId() != null) {
            subjects subject = new subjects();
            subject.setId(dto.getSubjectId());
            course.setSubject(subject);
        }

        // stream
        if (dto.getStreamId() != null) {
            Streams stream = new Streams();
            stream.setId(dto.getStreamId());
            course.setStream(stream);
        }

        // substream
        if (dto.getSubstreamId() != null) {
            substream sub = new substream();
            sub.setId(dto.getSubstreamId());
            course.setSubstream(sub);
        }

        return course;
    }
}
