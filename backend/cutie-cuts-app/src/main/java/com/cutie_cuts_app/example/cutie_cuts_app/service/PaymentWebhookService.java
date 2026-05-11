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

import java.time.LocalDateTime;
import java.util.Optional;

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
    public void processWebhook(WebhookPayload payload) {
        logger.info("Processing webhook for payment code: {}", payload.getPaymentCode());

        Optional<Payment> paymentOpt = paymentRepository.findByPaymentCode(payload.getPaymentCode());

        if (paymentOpt.isEmpty()) {
            logger.warn("Payment not found: {}", payload.getPaymentCode());
            return;
        }

        Payment payment = paymentOpt.get();

        if (!"PENDING".equals(payment.getStatus())) {
            logger.warn("Payment already processed: {}", payload.getPaymentCode());
            return;
        }

        if (Math.abs(payment.getAmount() - payload.getAmount()) > 0.01) {
            logger.error("Amount mismatch for payment: {}. Expected: {}, Received: {}",
                    payload.getPaymentCode(), payment.getAmount(), payload.getAmount());
            return;
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
    }
}
