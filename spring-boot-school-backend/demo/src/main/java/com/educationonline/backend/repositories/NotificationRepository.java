package com.educationonline.backend.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.educationonline.backend.entities.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findTop20ByTeacherIdOrderByReadAscCreatedAtDesc(Long teacherId);

    List<Notification> findTop30ByStudentIdOrderByReadAscCreatedAtDesc(Long studentId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Notification n SET n.read = true WHERE n.studentId = :studentId AND n.read = false")
    int markAllReadForStudent(@Param("studentId") Long studentId);

    long deleteByStudentId(Long studentId);

    long deleteByTeacherId(Long teacherId);
}
