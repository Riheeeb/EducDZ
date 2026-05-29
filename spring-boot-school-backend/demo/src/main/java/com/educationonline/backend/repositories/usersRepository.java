package com.educationonline.backend.repositories;




import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.educationonline.backend.entities.AccountType;
import com.educationonline.backend.entities.users;
import java.util.List;
import java.util.Optional;






@Repository
public interface usersRepository extends JpaRepository <users, Long> {

   Optional<users> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByName(String name);

    Page<users> findByAccountType(AccountType accountType, Pageable pageable);

    long countByAccountType(AccountType accountType);



}
