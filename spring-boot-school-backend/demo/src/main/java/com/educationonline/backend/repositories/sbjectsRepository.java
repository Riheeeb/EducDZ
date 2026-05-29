package com.educationonline.backend.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.educationonline.backend.entities.subjects;



@Repository
public interface sbjectsRepository extends JpaRepository<subjects, Long> {

    Optional<subjects> findByName(String namesubject);

    Optional<subjects> findById(Long id);

   
}
