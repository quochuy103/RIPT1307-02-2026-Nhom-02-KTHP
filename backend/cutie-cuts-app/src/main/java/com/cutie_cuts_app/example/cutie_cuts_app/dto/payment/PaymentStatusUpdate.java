package com.cutie_cuts_app.example.cutie_cuts_app.dto.payment;

public class PaymentStatusUpdate {
    private String paymentCode;
    private String status;
    private String message;

    public PaymentStatusUpdate() {
    }

    public PaymentStatusUpdate(String paymentCode, String status, String message) {
        this.paymentCode = paymentCode;
        this.status = status;
        this.message = message;
    }

    public String getPaymentCode() {
        return paymentCode;
    }

    public void setPaymentCode(String paymentCode) {
        this.paymentCode = paymentCode;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
