package com.cutie_cuts_app.example.cutie_cuts_app.service;

public interface EmailService {
    void sendPasswordResetOtp(String toEmail, String otp);
    void sendRegistrationOtp(String toEmail, String otp);
}
