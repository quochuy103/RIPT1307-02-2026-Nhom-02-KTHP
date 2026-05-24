package com.cutie_cuts_app.example.cutie_cuts_app.dto.payment;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

public class PaymentResponse {
    private Long id;
    private String paymentCode;
    private Long orderId;
    private Double amount;
    private String status;
    private String qrCodeUrl;
    private String qrDataUrl;
    private String bankAccount;
    private String bankCode;
    private String bankName;
    /** Serialized as UTC ISO-8601 with 'Z' suffix so browsers parse timezone correctly. */
    private Instant expiredAt;
    /** Serialized as UTC ISO-8601 with 'Z' suffix. */
    private Instant createdAt;

    public PaymentResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPaymentCode() {
        return paymentCode;
    }

    public void setPaymentCode(String paymentCode) {
        this.paymentCode = paymentCode;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getQrCodeUrl() {
        return qrCodeUrl;
    }

    public void setQrCodeUrl(String qrCodeUrl) {
        this.qrCodeUrl = qrCodeUrl;
    }

    public String getQrDataUrl() {
        return qrDataUrl;
    }

    public void setQrDataUrl(String qrDataUrl) {
        this.qrDataUrl = qrDataUrl;
    }

    public String getBankAccount() {
        return bankAccount;
    }

    public void setBankAccount(String bankAccount) {
        this.bankAccount = bankAccount;
    }

    public String getBankCode() {
        return bankCode;
    }

    public void setBankCode(String bankCode) {
        this.bankCode = bankCode;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public Instant getExpiredAt() {
        return expiredAt;
    }

    public void setExpiredAt(LocalDateTime expiredAt) {
        // Convert LocalDateTime (server-local/UTC) to Instant so Jackson serializes with 'Z'
        this.expiredAt = expiredAt != null ? expiredAt.toInstant(ZoneOffset.UTC) : null;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt != null ? createdAt.toInstant(ZoneOffset.UTC) : null;
    }
}
