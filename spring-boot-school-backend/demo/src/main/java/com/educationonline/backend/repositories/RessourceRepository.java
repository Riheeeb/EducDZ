package com.educationonline.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;


import com.educationonline.backend.entities.Ressources;
public interface RessourceRepository extends JpaRepository<Ressources, Long> {

}
