package com.educationonline.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.educationonline.backend.entities.QuestionAnswer;

public interface QuestionAnswerRepository extends JpaRepository<QuestionAnswer , Long> {

}
