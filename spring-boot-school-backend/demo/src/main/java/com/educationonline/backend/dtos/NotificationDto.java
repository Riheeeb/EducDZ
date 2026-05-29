package com.educationonline.backend.dtos;

import java.time.LocalDateTime;

import com.educationonline.backend.entities.Notification;

public record NotificationDto(
        Long id,
        String title,
        String message,
        boolean read,
        LocalDateTime createdAt,
        Long courseId,
        Long studentId) {

    public static NotificationDto fromEntity(Notification notification) {
        return new NotificationDto(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.isRead(),
                notification.getCreatedAt(),
                notification.getCourseId(),
                notification.getStudentId());
    }
}
