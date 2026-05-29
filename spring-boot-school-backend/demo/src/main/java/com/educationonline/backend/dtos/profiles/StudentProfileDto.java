package com.educationonline.backend.dtos.profiles;

import java.util.List;

import com.educationonline.backend.entities.StudentLevel;
import com.educationonline.backend.entities.StudyLevel;

public record StudentProfileDto(

    Long studentId,
    String name,
    String email,
    String     currentYearLabel,
    
    StudyLevel studyLevel,
    String     studyLevelLabel,
    
    int        totalPoints,
    int        totalEnrolledCourses,
    int        totalCompletedCourses,
    int        totalActiveCourses,
    int        pointsToNext,
    
    int        totalBadges,
    List<YearCardDto> yearHistory,

    StudentLevel studentLevel,
    Long streamId,
    Long yearId,
    Long substreamId
) {
public StudentProfileDto(StudentLevel studentLevel, Long streamId, Long yearId, Long substreamId) {
    this(
        null, // studentId
        null, // name
        null, // email
        null, // currentYearLabel
        null, // studyLevel
        null, // studyLevelLabel
        0,    // totalPoints
        0,    // totalEnrolledCourses
        0,    // totalCompletedCourses
        0,    // totalActiveCourses
        0,
        0,    // totalBadges
        List.of(), // yearHistory
        studentLevel,
        streamId,
        yearId,
        substreamId
    );
}

public StudentProfileDto(Long studentId2, String currentLevel, String currentYear, String currentSubject,
        StudyLevel studyLevel2, String studyLevelLabel2, int totalPoints2, int size, int totalCompleted,
        int totalActive,int pointsToNext , int totalBadges2, List<YearCardDto> yearHistory2) {
    this(
        studentId2,
        currentLevel,
        currentYear,
        currentSubject,
        studyLevel2,
        studyLevelLabel2,
        totalPoints2,
        size,
        totalCompleted,
        totalActive,
        pointsToNext,
        totalBadges2,
        yearHistory2,
        null,
        null,
        null,
        null
    );
}


 

}
