package com.cutie_cuts_app.example.cutie_cuts_app.repository;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByPaymentCode(String paymentCode);

    List<Payment> findByUserId(Long userId);

    List<Payment> findByOrderId(Long orderId);

    List<Payment> findByStatus(String status);

    List<Payment> findByStatusAndExpiredAtBefore(String status, LocalDateTime expiredAt);

    @Query("""
            SELECT p FROM Payment p WHERE
            (:status IS NULL OR LOWER(p.status) = :status) AND
            (:orderId IS NULL OR p.order.id = :orderId) AND
            p.createdAt >= :dateFrom AND
            p.createdAt <= :dateTo AND
            (:minAmount IS NULL OR p.amount >= :minAmount) AND
            (:maxAmount IS NULL OR p.amount <= :maxAmount) AND
            (:userId IS NULL OR p.user.id = :userId)
            """)
    Page<Payment> findAllFiltered(@Param("status") String status,
                                   @Param("orderId") Long orderId,
                                   @Param("dateFrom") LocalDateTime dateFrom,
                                   @Param("dateTo") LocalDateTime dateTo,
                                   @Param("minAmount") Double minAmount,
                                   @Param("maxAmount") Double maxAmount,
                                   @Param("userId") Long userId,
                                   Pageable pageable);
}
