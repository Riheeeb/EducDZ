package com.educationonline.backend.entities;


import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
@Entity
@Table(name = "students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor

public class students {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name ="id", nullable = false)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false )
    private StudentLevel studentLevel;

  

  
   

        @ManyToOne
        @JoinColumn(name = "id_sub_stream")
        private substream substream;

        @OneToOne
        @MapsId
        @JoinColumn(name = "id_user_stud" )
        private users userS;

        @ManyToOne
        @JoinColumn(name = "id_stream")
        private Streams streams;

        @JsonIgnore
        @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true)
        private List<Progress> progressList ;

        int points;

}
