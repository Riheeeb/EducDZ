package com.educationonline.backend.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.educationonline.backend.dtos.NotificationDto;
import com.educationonline.backend.services.NotificationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/teachers/{teacherId}/notifications")
    public ResponseEntity<List<NotificationDto>> teacherNotifications(@PathVariable Long teacherId) {
        return ResponseEntity.ok(notificationService.getTeacherNotifications(teacherId));
    }

    @GetMapping("/students/{studentId}/notifications")
    public ResponseEntity<List<NotificationDto>> studentNotifications(@PathVariable Long studentId) {
        return ResponseEntity.ok(notificationService.getStudentNotifications(studentId));
    }

    @PostMapping("/students/{studentId}/notifications/read-all")
    public ResponseEntity<Void> markAllStudentNotificationsRead(@PathVariable Long studentId) {
        notificationService.markAllStudentNotificationsRead(studentId);
        return ResponseEntity.noContent().build();
    }
}
