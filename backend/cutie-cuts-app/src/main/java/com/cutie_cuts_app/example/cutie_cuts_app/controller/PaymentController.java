package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.payment.PaymentRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.payment.PaymentResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@Tag(name = "Payment", description = "Payment management APIs")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    @Operation(summary = "Create payment for order")
    public ResponseEntity<PaymentResponse> createPayment(@RequestBody PaymentRequest request) {
        PaymentResponse response = paymentService.createPayment(request.getOrderId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{paymentCode}")
    @Operation(summary = "Get payment by code")
    public ResponseEntity<PaymentResponse> getPayment(@PathVariable String paymentCode) {
        PaymentResponse response = paymentService.getPaymentByCode(paymentCode);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-payments")
    @Operation(summary = "Get current user's payments")
    public ResponseEntity<List<PaymentResponse>> getMyPayments() {
        List<PaymentResponse> payments = paymentService.getUserPayments();
        return ResponseEntity.ok(payments);
    }
}
