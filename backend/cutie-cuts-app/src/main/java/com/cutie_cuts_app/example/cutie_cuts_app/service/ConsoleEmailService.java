package com.cutie_cuts_app.example.cutie_cuts_app.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.mail.provider", havingValue = "console", matchIfMissing = true)
public class ConsoleEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(ConsoleEmailService.class);

    @Override
    public void sendPasswordResetOtp(String toEmail, String otp) {
        log.info("=== PASSWORD RESET OTP ===");
        log.info("To: {}", toEmail);
        log.info("OTP: {}", otp);
        log.info("==========================");
    }

    @Override
    public void sendRegistrationOtp(String toEmail, String otp) {
        log.info("=== REGISTRATION OTP ===");
        log.info("To: {}", toEmail);
        log.info("OTP: {}", otp);
        log.info("=========================");
    }
}
