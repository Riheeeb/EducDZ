package com.educationonline.backend.entities;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
@Entity
@Table(name = "streams")

@Getter
@Setter


 
public class Streams {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name ="id", nullable = false)
    private Long id;
    public Streams(  stream_type streamType, Years year) {
        
        
        this.streamType = streamType;
        this.year = year;
    }

    public Streams() {
    }
    
    // For middle school, a stream can exist without a stream_type
    @ManyToOne(optional = true)
    @JoinColumn(name = "stream_type_id" , nullable = true)
     @JsonIgnoreProperties("streams")
       private stream_type streamType;

    @ManyToOne(optional = false)
    @JoinColumn(name = "year_id")
    private Years year;

    @JsonIgnore
    @OneToMany(mappedBy = "streams")
    private List<students> students = new ArrayList<> ();

    @JsonIgnore
    @OneToMany(mappedBy = "stream")
    private List<Courses> courses = new ArrayList<> ();

    @JsonIgnore
    @OneToMany(mappedBy = "streams")
      //list of substreams that have relation with specific stream
     private List<substream> substreams = new ArrayList<>();

     public Long getId() {
        return id;
}
}