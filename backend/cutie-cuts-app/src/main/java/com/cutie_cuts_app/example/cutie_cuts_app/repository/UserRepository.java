package com.cutie_cuts_app.example.cutie_cuts_app.repository;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface UserRepository extends JpaRepository<User, Long> {

    @Query("""
            SELECT u FROM User u WHERE
            (:role IS NULL OR LOWER(u.role) = :role) AND
            (:search IS NULL OR
             LOWER(u.name) LIKE :search OR
             LOWER(u.phone) LIKE :search OR
             EXISTS (SELECT 1 FROM UserAuth ua WHERE ua.user = u AND ua.authType = 'email' AND LOWER(ua.authValue) LIKE :search)) AND
            u.createdAt >= :createdFrom AND
            u.createdAt <= :createdTo
            """)
    Page<User> findAllFiltered(@Param("role") String role,
                               @Param("search") String search,
                               @Param("createdFrom") LocalDateTime createdFrom,
                               @Param("createdTo") LocalDateTime createdTo,
                               Pageable pageable);
}