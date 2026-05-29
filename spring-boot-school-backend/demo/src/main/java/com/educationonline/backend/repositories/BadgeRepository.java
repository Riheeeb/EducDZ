package com.educationonline.backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.educationonline.backend.entities.Badges;
import com.educationonline.backend.entities.Badges.BadgeTrigger;
import com.educationonline.backend.entities.StudentBadge;

public interface BadgeRepository extends JpaRepository<Badges, Long> {
     
    Optional<Badges> findByCode(String code);
 
    
    List<Badges> findByTrigger(BadgeTrigger trigger);
 
    List<Badges> findByTriggerAndPointsThresholdLessThanEqualOrderByPointsThresholdAsc(
            BadgeTrigger trigger,
            Integer pointsThreshold);

}
