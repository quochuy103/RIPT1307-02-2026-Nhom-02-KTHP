package com.cutie_cuts_app.example.cutie_cuts_app.repository;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.ShopOrder;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ShopOrderRepository extends JpaRepository<ShopOrder, Long> {
    List<ShopOrder> findByUser(User user);


    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from ShopOrder o where o.id = :id")
    Optional<ShopOrder> findByIdForUpdate(@Param("id") Long id);

    Page<ShopOrder> findByUser(User user, Pageable pageable);
    Page<ShopOrder> findByUserAndStatusIgnoreCase(User user, String status, Pageable pageable);
    long countByUser(User user);
    long countByUserAndStatusIgnoreCase(User user, String status);
    Optional<ShopOrder> findFirstByUserOrderByCreatedAtDesc(User user);

    @Query("""
            select coalesce(sum(o.totalPrice), 0)
            from ShopOrder o
            where o.user = :user and lower(o.status) = lower(:status)
            """)
    Double sumTotalPriceByUserAndStatus(@Param("user") User user, @Param("status") String status);

}
