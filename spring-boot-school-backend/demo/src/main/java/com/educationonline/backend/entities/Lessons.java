package com.educationonline.backend.entities;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "lessons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor

public class Lessons {

    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private Integer orderNumber;

    
    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference(value = "course-lessons")
    @JoinColumn(name = "course_id", nullable = true)
    private Courses courses;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "resource_id", nullable = true)
    private Ressources resource;

    @JsonIgnore
    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Quiz> quizzes = new ArrayList<>();

   @ManyToOne(fetch = FetchType.LAZY)
   @JsonBackReference
   @JoinColumn(name = "teacher_id" , nullable = true)
   private teachers teacher;
}
