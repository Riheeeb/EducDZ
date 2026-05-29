package com.educationonline.backend.services;

import java.util.Map;

import org.springframework.stereotype.Service;

import com.educationonline.backend.entities.BadgeEventType;
import com.educationonline.backend.entities.students;
import com.educationonline.backend.repositories.studentRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PointsService {

    private final studentRepository studentRepository;
    private final BadgeEngineService badgeEngine;

    @Transactional
    public void addPoints(Long studentId, int points, String reason) {

        students student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        student.setPoints(student.getPoints() + points);

        studentRepository.save(student);

        badgeEngine.handleEvent(
                studentId,
                BadgeEventType.POINTS_UPDATED,
                Map.of(
                        "totalPoints", student.getPoints(),
                        "reason", reason
                )
        );
    }
}
