package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.payment.WebhookPayload;
import com.cutie_cuts_app.example.cutie_cuts_app.service.PaymentWebhookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/webhooks")
@Tag(name = "Payment Webhook", description = "Payment webhook APIs for bank callbacks")
public class PaymentWebhookController {

    private static final Logger logger = LoggerFactory.getLogger(PaymentWebhookController.class);

    private final PaymentWebhookService webhookService;

    public PaymentWebhookController(PaymentWebhookService webhookService) {
        this.webhookService = webhookService;
    }

    @PostMapping("/payment")
    @Operation(summary = "Receive payment webhook from bank")
    public ResponseEntity<Map<String, String>> handlePaymentWebhook(@RequestBody WebhookPayload payload) {
        try {
            logger.info("Received webhook for payment: {}", payload.getPaymentCode());
            webhookService.processWebhook(payload);
            return ResponseEntity.ok(Map.of("status", "success", "message", "Webhook processed"));
        } catch (Exception e) {
            logger.error("Error processing webhook: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("status", "error", "message", e.getMessage()));
        }
    }
}
