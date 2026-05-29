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
@Table(name = "stream_type")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
 
public class stream_type {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column
    private Long id;
    @Column( length = 100 )
    private String namestream;

    public stream_type( String namestream) {
        
        this.namestream = namestream;
    }
    @JsonIgnore
    @OneToMany(mappedBy = "streamType")
    private List<Streams> streams = new ArrayList<> ();
    
   

   
    


   

    
    
     
    }
