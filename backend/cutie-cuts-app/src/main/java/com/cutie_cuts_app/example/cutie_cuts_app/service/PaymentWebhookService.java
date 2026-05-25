package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.payment.PaymentStatusUpdate;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.payment.WebhookPayload;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Payment;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.PaymentTransaction;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.ShopOrder;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.PaymentRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.PaymentTransactionRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ShopOrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class PaymentWebhookService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentWebhookService.class);

    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final ShopOrderRepository orderRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public PaymentWebhookService(PaymentRepository paymentRepository,
            PaymentTransactionRepository transactionRepository,
            ShopOrderRepository orderRepository,
            SimpMessagingTemplate messagingTemplate) {
        this.paymentRepository = paymentRepository;
        this.transactionRepository = transactionRepository;
        this.orderRepository = orderRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public String processWebhook(WebhookPayload payload) {
        validatePayload(payload);
        logger.info("Processing webhook for payment code: {}", payload.getPaymentCode());

        Optional<Payment> paymentOpt = paymentRepository.findByPaymentCode(payload.getPaymentCode());

        if (paymentOpt.isEmpty()) {
            throw new ResponseStatusException(NOT_FOUND, "Payment not found");
        }

        Payment payment = paymentOpt.get();

        if ("COMPLETED".equalsIgnoreCase(payment.getStatus())) {
            logger.info("Webhook already processed for payment {}", payload.getPaymentCode());
            return "Webhook already processed";
        }

        if (payment.getExpiredAt() != null && payment.getExpiredAt().isBefore(LocalDateTime.now())) {
            payment.setStatus("EXPIRED");
            paymentRepository.save(payment);
            throw new ResponseStatusException(CONFLICT, "Payment already expired");
        }

        if (!"PENDING".equalsIgnoreCase(payment.getStatus())) {
            throw new ResponseStatusException(CONFLICT, "Payment is not in pending status");
        }

        if (Math.abs(payment.getAmount() - payload.getAmount()) > 0.01) {
            throw new ResponseStatusException(CONFLICT, "Payment amount mismatch");
        }

        transactionRepository.findByTransactionCode(payload.getTransactionCode())
                .ifPresent(existingTransaction -> {
                    if (!existingTransaction.getPayment().getId().equals(payment.getId())) {
                        throw new ResponseStatusException(CONFLICT, "Transaction code already used");
                    }
                });

        if (payment.getTransactionId() != null && !payment.getTransactionId().isBlank()) {
            logger.info("Payment {} already has transaction id {}, treating webhook as processed",
                    payload.getPaymentCode(), payment.getTransactionId());
            return "Webhook already processed";
        }

        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setPayment(payment);
        transaction.setTransactionCode(payload.getTransactionCode());
        transaction.setAmount(payload.getAmount());
        transaction.setBankCode(payload.getBankCode());
        transaction.setTransactionDate(payload.getTransactionDate());
        transaction.setDescription(payload.getDescription());
        transactionRepository.save(transaction);

        payment.setStatus("COMPLETED");
        payment.setPaidAt(LocalDateTime.now());
        payment.setTransactionId(payload.getTransactionCode());
        paymentRepository.save(payment);

        ShopOrder order = payment.getOrder();
        order.setStatus("paid");
        orderRepository.save(order);

        logger.info("Payment completed successfully: {}", payload.getPaymentCode());

        PaymentStatusUpdate statusUpdate = new PaymentStatusUpdate(
                payment.getPaymentCode(),
                "COMPLETED",
                "Payment completed successfully");
        messagingTemplate.convertAndSend("/topic/payment/" + payment.getPaymentCode(), statusUpdate);
        return "Webhook processed";
    }

    private void validatePayload(WebhookPayload payload) {
        if (payload == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Webhook payload is required");
        }
        if (isBlank(payload.getPaymentCode())) {
            throw new ResponseStatusException(BAD_REQUEST, "Payment code is required");
        }
        if (isBlank(payload.getTransactionCode())) {
            throw new ResponseStatusException(BAD_REQUEST, "Transaction code is required");
        }
        if (payload.getAmount() == null || payload.getAmount() <= 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Valid payment amount is required");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
