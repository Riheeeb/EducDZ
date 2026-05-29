package com.educationonline.backend.services;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.educationonline.backend.dtos.NotificationDto;
import com.educationonline.backend.entities.Courses;
import com.educationonline.backend.entities.Notification;
import com.educationonline.backend.entities.students;
import com.educationonline.backend.repositories.NotificationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public void notifyEnrollment(Courses course, students student) {
        if (course == null || course.getTeacher() == null || student == null) {
            return;
        }

        String studentName = student.getUserS() != null ? student.getUserS().getName() : "A student";
        String courseTitle = course.getTitle() != null ? course.getTitle() : "your course";

        notificationRepository.save(Notification.builder()
                .teacherId(course.getTeacher().getId())
                .courseId(course.getId())
                .title("New enrollment")
                .message(studentName + " enrolled in " + courseTitle + ".")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getTeacherNotifications(Long teacherId) {
        return notificationRepository.findTop20ByTeacherIdOrderByReadAscCreatedAtDesc(teacherId)
                .stream()
                .map(NotificationDto::fromEntity)
                .toList();
    }

    @Transactional
    public void notifyStudentBadgeEarned(Long studentId, String badgeName, int bonusPoints) {
        if (studentId == null) {
            return;
        }
        String bonus = bonusPoints > 0 ? " +" + bonusPoints + " points." : "";
        notificationRepository.save(Notification.builder()
                .teacherId(null)
                .studentId(studentId)
                .courseId(null)
                .title("New badge earned")
                .message("You earned the \"" + badgeName + "\" badge!" + bonus)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getStudentNotifications(Long studentId) {
        return notificationRepository.findTop30ByStudentIdOrderByReadAscCreatedAtDesc(studentId)
                .stream()
                .map(NotificationDto::fromEntity)
                .toList();
    }

    @Transactional
    public void markAllStudentNotificationsRead(Long studentId) {
        if (studentId == null) {
            return;
        }
        notificationRepository.markAllReadForStudent(studentId);
    }
}
