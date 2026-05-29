package com.educationonline.backend.entities;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonValue;

import jakarta.persistence.*;
@Entity
@Table(name = "years")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Years {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name ="id", nullable = false)
    private Long id;

    public enum yearValue {
       Y1_AM("1AM"),
        Y2_AM("2AM"),
        Y3_AM("3AM"),
        Y4_AM("4AM"),
        Y1_AS("1AS"),
        Y2_AS("2AS"),
        Y3_AS("3AS");
    
         
      private final String value;

             yearValue (String value){
                this.value=value;
             }
              
             @JsonValue
             public String getValue(){
                return value;
             }

             
            @JsonCreator
            public static yearValue fromValue(String value){
                for (yearValue y : values()){
                    if(y.value.equalsIgnoreCase(value)){
                        return y;
                    }
                }
                throw new IllegalArgumentException("Invalid year "+ value);
            }
            // Helper methods to check if the year belongs to middle school or high school
              public boolean isMiddleSchool() {
            return this == Y1_AM || this == Y2_AM || this == Y3_AM || this == Y4_AM;
        }

        public boolean isHighSchool() {
            return this == Y1_AS || this == Y2_AS || this == Y3_AS;
        }
    }

    @Enumerated(EnumType.STRING)
    @Column(name ="year", nullable = false )    
    private yearValue year;

     @Column(name = "year_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private StudentLevel yearType; 

  

   

    @JsonIgnore
    @OneToMany(mappedBy = "year")
    private List<Streams> streams = new ArrayList<> ();

    public Years(yearValue year , StudentLevel yearType) {
        this.year = year;
        this.yearType = yearType;
    }

    public String getLabel() {
        return year != null ? year.getValue() : null;
    }
}
