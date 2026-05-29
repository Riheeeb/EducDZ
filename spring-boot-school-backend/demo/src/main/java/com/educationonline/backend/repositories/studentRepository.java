package com.educationonline.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.educationonline.backend.entities.students;



@Repository
public interface studentRepository extends JpaRepository<students, Long> {

    //findBy user
    students findByUserSId(Long id);
}
