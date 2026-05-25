package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.payment.WebhookPayload;
import com.cutie_cuts_app.example.cutie_cuts_app.service.PaymentWebhookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

@RestController
@RequestMapping("/api/webhooks")
@Tag(name = "Payment Webhook", description = "Payment webhook APIs for bank callbacks")
public class PaymentWebhookController {

    private static final Logger logger = LoggerFactory.getLogger(PaymentWebhookController.class);
    private static final String WEBHOOK_SECRET_HEADER = "X-Webhook-Secret";

    private final PaymentWebhookService webhookService;
    private final String webhookSecret;

    public PaymentWebhookController(
            PaymentWebhookService webhookService,
            @Value("${app.payment.webhook-secret:}") String webhookSecret) {
        this.webhookService = webhookService;
        this.webhookSecret = webhookSecret;
    }

    @PostMapping("/payment")
    @Operation(summary = "Receive payment webhook from bank")
    public ResponseEntity<Map<String, String>> handlePaymentWebhook(
            @RequestBody WebhookPayload payload,
            @RequestHeader(value = WEBHOOK_SECRET_HEADER, required = false) String providedSecret) {
        validateWebhookSecret(providedSecret);
        logger.info("Received webhook for payment: {}", payload.getPaymentCode());
        String message = webhookService.processWebhook(payload);
        return ResponseEntity.ok(Map.of("status", "success", "message", message));
    }

    private void validateWebhookSecret(String providedSecret) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            throw new ResponseStatusException(SERVICE_UNAVAILABLE, "Payment webhook secret is not configured");
        }
        if (!webhookSecret.equals(providedSecret)) {
            throw new ResponseStatusException(FORBIDDEN, "Invalid webhook secret");
        }
    }
}
