package com.cutie_cuts_app.example.cutie_cuts_app.repository;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
