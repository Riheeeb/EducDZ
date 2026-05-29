package com.educationonline.backend.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.educationonline.backend.entities.AccountType;
import com.educationonline.backend.entities.teachers;

@Repository
public interface teachersRepository extends JpaRepository<teachers, Long> {

    teachers findByUserTId(Long id);

    default List<teachers> searchByUserNameContaining(String q) {
        return searchByUserNameContaining(q, AccountType.TEACHER);
    }

    @Query("""
            SELECT DISTINCT t FROM teachers t
            JOIN FETCH t.userT u
            WHERE u.accountType = :accountType
            AND LOWER(u.name) LIKE LOWER(CONCAT('%', :q, '%'))
            ORDER BY u.name
            """)
    List<teachers> searchByUserNameContaining(@Param("q") String q, @Param("accountType") AccountType accountType);
}
