package com.cutie_cuts_app.example.cutie_cuts_app.repository;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserAddressRepository extends JpaRepository<UserAddress, Long> {

    List<UserAddress> findByUserIdAndDeletedFalse(Long userId);

    Optional<UserAddress> findByIdAndUserIdAndDeletedFalse(Long id, Long userId);

    Optional<UserAddress> findByUserIdAndIsDefaultTrueAndDeletedFalse(Long userId);

    long countByUserIdAndDeletedFalse(Long userId);

    @Modifying
    @Query("UPDATE UserAddress a SET a.isDefault = false WHERE a.user.id = :userId AND a.isDefault = true AND a.deleted = false")
    void clearDefaultForUser(@Param("userId") Long userId);

    @Query("SELECT a FROM UserAddress a WHERE a.user.id = :userId AND a.deleted = false AND a.id <> :excludeId ORDER BY a.updatedAt DESC, a.id DESC")
    List<UserAddress> findReplacementDefault(@Param("userId") Long userId, @Param("excludeId") Long excludeId);
}
