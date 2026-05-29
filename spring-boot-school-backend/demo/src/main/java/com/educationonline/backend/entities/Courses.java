package com.educationonline.backend.entities;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;



@Entity
@Table(name = "courses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Data
@EqualsAndHashCode(callSuper = false )
@EntityListeners(AuditingEntityListener.class)
public class Courses {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    private String title;

    
    private BigDecimal price;

    @NotNull
    @Column(name = "level")
    @Enumerated(EnumType.STRING)
    private StudentLevel studentLevel;

    private String description;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @NotNull
    @Column(name = "year")
    @Enumerated(EnumType.STRING)
        private Years.yearValue year; 

    


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private subjects subject; // Each course belongs to one subject

    @JsonIgnore
    @OneToMany(mappedBy = "courses", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference(value = "course-lessons")
    private List<Lessons> lesson = new ArrayList<>(); // List of lessons associated with the course

    @JsonIgnore
    @OneToMany(mappedBy = "courses", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference(value = "course-enrollments")
    private List<Enrollment> enrollments; // List of enrollments for this course

   @Column(nullable = false)// default is false, course still in draft mode until teacher publish it
    private Boolean published;
    // points when course is completed, default is 100
     @Column(nullable = false, columnDefinition = "INT DEFAULT 100")
    private Integer completionPoints;

   

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference
    @JoinColumn(name = "teacher_id", nullable = false)
    private teachers teacher; // Each course is taught by one teacher

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stream_id", nullable = true)
    private Streams stream; // Each course belongs to one stream and each stream have a relation with stream_type and year

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "substream_id", nullable = true)
    private substream substream; // Each course can belong to one substream, but it's optional
    
    @JsonIgnore
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Quiz> quizes; // List of certificates associated with the course

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<StudentBadge> studentBadges; // List of badges earned by students in this course
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (published == null) published = false;
        if (completionPoints == null) completionPoints = 100;
    }
    public boolean isPublished() {      
        return published;
    }


}
