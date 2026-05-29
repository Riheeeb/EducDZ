package com.educationonline.backend.repositories;

import java.time.Year;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.educationonline.backend.entities.StudentLevel;
import com.educationonline.backend.entities.Years;

public interface yearRepo extends JpaRepository<Years, Long> {
    Optional<Years> findByYear(Years.yearValue yearValue);

    List<Years> findByYearType(StudentLevel yearType);

}
