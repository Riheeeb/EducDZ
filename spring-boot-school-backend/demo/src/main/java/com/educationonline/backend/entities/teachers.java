package com.educationonline.backend.entities;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.*;
@Entity
@Table(name = "teachers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class teachers {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name ="id", nullable = false)
    private Long id;
   

    //MANY teachers one subject
    @ManyToOne(optional = false)
    @JoinColumn(name = "id_subject", nullable = false) //just one subject
    private subjects subject;

    @OneToOne
    @MapsId
    @JoinColumn(name = "id_user" )
    private users userT; // this is ownership side

    @OneToMany(mappedBy = "teacher")
@JsonManagedReference
    private List<Courses> courses = new ArrayList<> ();

@OneToMany
@JsonManagedReference
private List<Lessons> lesson = new ArrayList<> ();
    
    @OneToMany(mappedBy = "teacher")
@JsonManagedReference
    private List<Quiz> quizzes = new ArrayList<> ();

    

}
