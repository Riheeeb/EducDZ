package com.educationonline.backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.educationonline.backend.entities.substream;

@Repository
public interface substreamRepository extends JpaRepository<substream, Long> {

    Optional<substream> findByNamesubstream(String namesubstream);

    List<substream> findByStreamsId(Long streamId);

}
