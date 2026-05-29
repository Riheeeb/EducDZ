package com.educationonline.backend.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "resources")
@Data
@NoArgsConstructor
@AllArgsConstructor

public class Ressources {

     @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    
    @Column(name = "video_url", length = 1000)
    private String videoUrl;

    
    @Column(name = "pdf_url", length = 1000)
    private String pdfUrl;

    
    @OneToOne(mappedBy = "resource")
    private Lessons lesson;

}
