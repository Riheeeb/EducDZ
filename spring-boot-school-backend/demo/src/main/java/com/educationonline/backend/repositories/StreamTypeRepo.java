package com.educationonline.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.educationonline.backend.entities.stream_type;

public interface StreamTypeRepo extends JpaRepository<stream_type, Long> {

}
