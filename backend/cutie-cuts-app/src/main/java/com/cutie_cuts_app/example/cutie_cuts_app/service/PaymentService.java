package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.payment.PaymentResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.payment.VietQRResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Payment;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.ShopOrder;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.PaymentRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.PaymentTransactionRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ShopOrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository transactionRepository;
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
            PaymentTransactionRepository transactionRepository,
            ShopOrderRepository orderRepository,
            VietQRService vietQRService,
            CurrentUserService currentUserService) {
        this.paymentRepository = paymentRepository;
        this.transactionRepository = transactionRepository;
        this.orderRepository = orderRepository;
        this.vietQRService = vietQRService;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public PaymentResponse createPayment(Long orderId) {
        User currentUser = currentUserService.getCurrentUser();

        ShopOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized access to order");
        }

        if (!"pending".equalsIgnoreCase(order.getStatus())) {
            throw new RuntimeException("Order is not in pending status");
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

        if (qrResponse == null) {
            logger.error("VietQR API call failed (network/config error) for order: {}", orderId);
            throw new RuntimeException("Không thể kết nối đến dịch vụ thanh toán. Vui lòng thử lại sau.");
        }
        if (qrResponse.getData() == null) {
            logger.error("VietQR API returned no data for order: {}. Response code: {}, desc: {}",
                    orderId, qrResponse.getCode(), qrResponse.getDesc());
            throw new RuntimeException("Dịch vụ VietQR từ chối tạo mã QR: " + qrResponse.getDesc());
        }
        if (qrResponse.getData().getQrDataURL() == null) {
            logger.error("VietQR API returned data but qrDataURL is null for order: {}", orderId);
            throw new RuntimeException("Không thể tạo mã QR thanh toán. Vui lòng thử lại sau.");
        }

        payment.setQrCodeUrl(qrResponse.getData().getQrCode());
        payment.setQrDataUrl(qrResponse.getData().getQrDataURL());

        payment = paymentRepository.save(payment);

        logger.info("Payment created: {} for order: {}", paymentCode, orderId);

        return mapToResponse(payment);
    }

    public PaymentResponse getPaymentByCode(String paymentCode) {
        Payment payment = paymentRepository.findByPaymentCode(paymentCode)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        return mapToResponse(payment);
    }

    public List<PaymentResponse> getUserPayments() {
        User currentUser = currentUserService.getCurrentUser();
        List<Payment> payments = paymentRepository.findByUserId(currentUser.getId());
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
