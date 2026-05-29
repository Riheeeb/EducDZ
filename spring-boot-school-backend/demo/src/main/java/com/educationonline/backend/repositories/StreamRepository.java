package com.educationonline.backend.repositories;


import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.educationonline.backend.entities.Streams;

import com.educationonline.backend.entities.Years;

@Repository
public interface StreamRepository extends JpaRepository<Streams, Long> {

   

    Optional<Streams> findByStreamTypeIdAndYearId(Long stream_type, Long year);

    Optional<Streams> findByStreamTypeIsNullAndYearId(Long year);

     List<Streams> findByYear(String year);
        List<Streams> findByYearId(Long yearId);
     
}


