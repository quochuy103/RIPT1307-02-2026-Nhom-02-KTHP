package com.cutie_cuts_app.example.cutie_cuts_app.dto.payment;

public class PaymentRequest {
    private Long orderId;

    public PaymentRequest() {
    }

    public PaymentRequest(Long orderId) {
        this.orderId = orderId;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }
}
