package com.educationonline.backend.entities;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.persistence.*;
@Entity
@Table(name = "subjects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class subjects {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name ="id", nullable = false)
    private Long id;
    @Column( nullable = false, length = 150 , unique = true )
    private String name;

    public subjects(String name) {
    
        this.name = name;
    }

    @JsonIgnore
    @OneToMany(mappedBy = "subject")
    private List<teachers> teachers = new ArrayList<> ();

    @JsonIgnore
    @OneToMany(mappedBy = "subject")
    private List<Courses> courses = new ArrayList<> ();

   

}
