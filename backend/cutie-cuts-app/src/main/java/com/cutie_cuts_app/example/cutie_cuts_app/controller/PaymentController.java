package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.payment.PaymentRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.payment.PaymentResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

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
    public ResponseEntity<PaymentResponse> createPayment(@RequestBody PaymentRequest request,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }
        PaymentResponse response = paymentService.createPayment(request.getOrderId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{paymentCode}")
    @Operation(summary = "Get payment by code")
    public ResponseEntity<PaymentResponse> getPayment(@PathVariable String paymentCode,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }
        PaymentResponse response = paymentService.getPaymentByCode(paymentCode);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-payments")
    @Operation(summary = "Get current user's payments")
    public ResponseEntity<List<PaymentResponse>> getMyPayments(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }
        List<PaymentResponse> payments = paymentService.getUserPayments();
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/my-payments/page")
    @Operation(summary = "Get current user's payments (paginated)")
    public ResponseEntity<Page<PaymentResponse>> getMyPaymentsPaged(
            @PageableDefault(size = 20) Pageable pageable,
            Authentication authentication,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long orderId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) Double minAmount,
            @RequestParam(required = false) Double maxAmount) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }

        if (minAmount != null && maxAmount != null && minAmount > maxAmount) {
            throw new ResponseStatusException(BAD_REQUEST, "minAmount must be <= maxAmount");
        }

        String statusLower = status != null && !status.isBlank() ? status.toLowerCase() : null;
        LocalDateTime from = dateFrom != null ? dateFrom.atStartOfDay() : LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime to = dateTo != null ? dateTo.atTime(LocalTime.MAX) : LocalDateTime.of(2099, 12, 31, 23, 59);

        return ResponseEntity.ok(paymentService.getUserPaymentsFiltered(
                statusLower, orderId, from, to, minAmount, maxAmount, pageable));
    }

    @GetMapping("/page")
    @Operation(summary = "Get all payments (admin)")
    public ResponseEntity<Page<PaymentResponse>> getAllPaged(
            @PageableDefault(size = 20) Pageable pageable,
            Authentication authentication,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long orderId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) Double minAmount,
            @RequestParam(required = false) Double maxAmount) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }
        if (!isAdmin(authentication)) {
            throw new ResponseStatusException(FORBIDDEN, "Only admins can view all payments");
        }

        if (minAmount != null && maxAmount != null && minAmount > maxAmount) {
            throw new ResponseStatusException(BAD_REQUEST, "minAmount must be <= maxAmount");
        }

        String statusLower = status != null && !status.isBlank() ? status.toLowerCase() : null;
        LocalDateTime from = dateFrom != null ? dateFrom.atStartOfDay() : LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime to = dateTo != null ? dateTo.atTime(LocalTime.MAX) : LocalDateTime.of(2099, 12, 31, 23, 59);

        return ResponseEntity.ok(paymentService.getAllPaymentsFiltered(
                statusLower, orderId, userId, from, to, minAmount, maxAmount, pageable));
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}
