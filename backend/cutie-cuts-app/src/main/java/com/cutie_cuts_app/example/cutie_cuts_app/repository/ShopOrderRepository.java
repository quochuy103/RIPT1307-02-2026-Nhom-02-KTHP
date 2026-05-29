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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ShopOrderRepository extends JpaRepository<ShopOrder, Long> {
    interface MonthlyOrderRevenueSummary {
        Integer getYear();
        Integer getMonth();
        Double getRevenue();
    }

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

    @Query("""
            SELECT o FROM ShopOrder o WHERE
            (:status IS NULL OR LOWER(o.status) = :status) AND
            (:userId IS NULL OR o.user.id = :userId) AND
            o.createdAt >= :dateFrom AND
            o.createdAt <= :dateTo AND
            (:minTotal IS NULL OR o.totalPrice >= :minTotal) AND
            (:maxTotal IS NULL OR o.totalPrice <= :maxTotal)
            """)
    Page<ShopOrder> findAllFiltered(@Param("status") String status,
                                    @Param("userId") Long userId,
                                    @Param("dateFrom") LocalDateTime dateFrom,
                                    @Param("dateTo") LocalDateTime dateTo,
                                    @Param("minTotal") Double minTotal,
                                    @Param("maxTotal") Double maxTotal,
                                    Pageable pageable);

    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    @Query("SELECT COALESCE(SUM(o.totalPrice), 0.0) FROM ShopOrder o WHERE LOWER(o.status) NOT IN ('pending', 'cancelled')")
    Double sumTotalRevenue();

    @Query("SELECT COALESCE(SUM(o.totalPrice), 0.0) FROM ShopOrder o WHERE LOWER(o.status) NOT IN ('pending', 'cancelled') AND o.createdAt >= :from AND o.createdAt < :to")
    Double sumRevenueByCreatedAtBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("""
            SELECT YEAR(o.createdAt) AS year,
                   MONTH(o.createdAt) AS month,
                   COALESCE(SUM(CASE WHEN LOWER(o.status) NOT IN ('pending', 'cancelled') THEN o.totalPrice ELSE 0.0 END), 0.0) AS revenue
            FROM ShopOrder o
            WHERE o.createdAt >= :from AND o.createdAt < :to
            GROUP BY YEAR(o.createdAt), MONTH(o.createdAt)
            """)
    List<MonthlyOrderRevenueSummary> summarizeRevenueByMonthBetween(@Param("from") LocalDateTime from,
                                                                    @Param("to") LocalDateTime to);
}
