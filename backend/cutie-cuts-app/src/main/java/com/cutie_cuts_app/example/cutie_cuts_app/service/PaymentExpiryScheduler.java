package com.cutie_cuts_app.example.cutie_cuts_app.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class PaymentExpiryScheduler {

    private final PaymentService paymentService;

    public PaymentExpiryScheduler(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @Scheduled(fixedDelayString = "${app.payment.expiry-check-delay-ms:60000}")
    public void expirePendingPayments() {
        paymentService.expireOldPayments();
    }
}
