package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.payment.PaymentResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.payment.VietQRResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Payment;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.ShopOrder;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.PaymentRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ShopOrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_GATEWAY;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final ShopOrderRepository orderRepository;
    private final VietQRService vietQRService;
    private final CurrentUserService currentUserService;

    @Value("${vietqr.bank.id:970422}")
    private String bankId;

    @Value("${vietqr.account.no:100845448666}")
    private String accountNo;

    @Value("${vietqr.account.name:CUTIE CUTS SALON}")
    private String accountName;

    public PaymentService(PaymentRepository paymentRepository,
            ShopOrderRepository orderRepository,
            VietQRService vietQRService,
            CurrentUserService currentUserService) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.vietQRService = vietQRService;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public PaymentResponse createPayment(Long orderId) {
        if (orderId == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Order id is required");
        }

        User currentUser = currentUserService.getCurrentUser();

        ShopOrder order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));

        if (!order.getUser().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "Unauthorized access to order");
        }

        if (!"pending".equalsIgnoreCase(order.getStatus())) {
            throw new ResponseStatusException(CONFLICT, "Order is not in pending status");
        }

        Payment activePayment = resolveExistingPayment(order);
        if (activePayment != null) {
            logger.info("Reusing active payment {} for order {}", activePayment.getPaymentCode(), orderId);
            return mapToResponse(activePayment);
        }

        String paymentCode = generatePaymentCode();

        Payment payment = new Payment();
        payment.setPaymentCode(paymentCode);
        payment.setOrder(order);
        payment.setUser(currentUser);
        payment.setAmount(order.getTotalPrice());
        payment.setStatus("PENDING");
        payment.setBankAccount(accountNo);
        payment.setBankCode(bankId);
        payment.setBankName(getBankName(bankId));
        payment.setPaymentMethod("VIETQR");
        payment.setExpiredAt(LocalDateTime.now().plusMinutes(5));

        VietQRResponse qrResponse = vietQRService.generateQRCode(paymentCode, order.getTotalPrice());
        if (qrResponse == null || qrResponse.getData() == null) {
            throw new ResponseStatusException(BAD_GATEWAY, "Unable to generate QR code for payment");
        }

        payment.setQrCodeUrl(qrResponse.getData().getQrCode());
        payment.setQrDataUrl(qrResponse.getData().getQrDataURL());
        if (isBlank(payment.getQrCodeUrl()) && isBlank(payment.getQrDataUrl())) {
            throw new ResponseStatusException(BAD_GATEWAY, "Unable to generate QR code for payment");
        }

        payment = paymentRepository.save(payment);

        logger.info("Payment created: {} for order: {}", paymentCode, orderId);

        return mapToResponse(payment);
    }

    public PaymentResponse getPaymentByCode(String paymentCode) {
        User currentUser = currentUserService.getCurrentUser();
        Payment payment = paymentRepository.findByPaymentCode(paymentCode)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Payment not found"));

        if (!payment.getUser().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(NOT_FOUND, "Payment not found");
        }

        expireIfNeeded(payment);
        return mapToResponse(payment);
    }

    public List<PaymentResponse> getUserPayments() {
        User currentUser = currentUserService.getCurrentUser();
        List<Payment> payments = paymentRepository.findByUserId(currentUser.getId());
        payments.forEach(this::expireIfNeeded);
        return payments.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public void expireOldPayments() {
        List<Payment> expiredPayments = paymentRepository
                .findByStatusAndExpiredAtBefore("PENDING", LocalDateTime.now());

        for (Payment payment : expiredPayments) {
            payment.setStatus("EXPIRED");
            paymentRepository.save(payment);
            logger.info("Payment expired: {}", payment.getPaymentCode());
        }
    }

    private Payment resolveExistingPayment(ShopOrder order) {
        Payment activePendingPayment = null;

        for (Payment existingPayment : paymentRepository.findByOrderId(order.getId())) {
            expireIfNeeded(existingPayment);

            if ("COMPLETED".equalsIgnoreCase(existingPayment.getStatus())) {
                throw new ResponseStatusException(CONFLICT, "Order has already been paid");
            }

            if ("PENDING".equalsIgnoreCase(existingPayment.getStatus())) {
                if (isBlank(existingPayment.getQrCodeUrl()) && isBlank(existingPayment.getQrDataUrl())) {
                    existingPayment.setStatus("EXPIRED");
                    paymentRepository.save(existingPayment);
                    logger.warn("Marked legacy pending payment {} as expired because it has no QR payload",
                            existingPayment.getPaymentCode());
                    continue;
                }

                if (activePendingPayment == null) {
                    activePendingPayment = existingPayment;
                    continue;
                }

                LocalDateTime currentCreatedAt = activePendingPayment.getCreatedAt();
                LocalDateTime candidateCreatedAt = existingPayment.getCreatedAt();
                Comparator<LocalDateTime> comparator = Comparator.nullsFirst(Comparator.naturalOrder());
                if (comparator.compare(currentCreatedAt, candidateCreatedAt) < 0) {
                    activePendingPayment = existingPayment;
                }
            }
        }

        return activePendingPayment;
    }

    private void expireIfNeeded(Payment payment) {
        if (!"PENDING".equalsIgnoreCase(payment.getStatus())) {
            return;
        }
        if (payment.getExpiredAt() == null || !payment.getExpiredAt().isBefore(LocalDateTime.now())) {
            return;
        }

        payment.setStatus("EXPIRED");
        paymentRepository.save(payment);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String generatePaymentCode() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String random = String.format("%04d", new Random().nextInt(10000));
        return "CUTIE" + timestamp + random;
    }

    private String getBankName(String bankCode) {
        return switch (bankCode) {
            case "970422" -> "MB Bank";
            case "970415" -> "Vietinbank";
            case "970436" -> "Vietcombank";
            case "970418" -> "BIDV";
            case "970405" -> "Agribank";
            case "970407" -> "Techcombank";
            case "970432" -> "VPBank";
            default -> "Bank";
        };
    }

    private PaymentResponse mapToResponse(Payment payment) {
        PaymentResponse response = new PaymentResponse();
        response.setId(payment.getId());
        response.setPaymentCode(payment.getPaymentCode());
        response.setOrderId(payment.getOrder().getId());
        response.setAmount(payment.getAmount());
        response.setStatus(payment.getStatus());
        response.setQrCodeUrl(payment.getQrCodeUrl());
        response.setQrDataUrl(payment.getQrDataUrl());
        response.setBankAccount(payment.getBankAccount());
        response.setBankCode(payment.getBankCode());
        response.setBankName(payment.getBankName());
        response.setExpiredAt(payment.getExpiredAt());
        response.setCreatedAt(payment.getCreatedAt());
        return response;
    }
}
