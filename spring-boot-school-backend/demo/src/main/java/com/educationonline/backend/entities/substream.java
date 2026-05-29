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
@Table(name = "sub_stream")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class substream {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     @Column(name = "id", nullable = false)
     private long id ;
     
     @Column(name = "name_sub_stream",nullable = false , length = 45 )
     private String namesubstream;

     public substream( String namesubstream) {
        
        this.namesubstream = namesubstream;
     }

     //join FK from stream table(MANY TO MANY RELATION)
    @JsonIgnore
     @OneToMany(mappedBy = "substream")
     private List<students> students = new ArrayList<> ();

     @ManyToOne(optional = false)
     @JoinColumn(name = "stream_id", nullable = false)
     private Streams streams;

     @JsonIgnore
     @OneToMany(mappedBy = "substream")
       private List<Courses> courses ;

     public String getNameSubstream() {
        return namesubstream;
     }

    




}
