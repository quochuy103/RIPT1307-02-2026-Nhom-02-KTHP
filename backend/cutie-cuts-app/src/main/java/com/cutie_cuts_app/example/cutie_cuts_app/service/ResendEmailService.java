package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.mail.provider", havingValue = "resend")
public class ResendEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(ResendEmailService.class);

    private final Resend resend;
    private final String mailFrom;
    private final int passwordResetOtpExpiryMinutes;
    private final int emailVerificationOtpExpiryMinutes;

    public ResendEmailService(
            @Value("${app.resend.api-key}") String apiKey,
            @Value("${app.mail.from}") String mailFrom,
            @Value("${app.password-reset.otp-expiry-minutes}") int passwordResetOtpExpiryMinutes,
            @Value("${app.email-verification.otp-expiry-minutes}") int emailVerificationOtpExpiryMinutes) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("RESEND_API_KEY is required when APP_MAIL_PROVIDER=resend");
        }
        this.resend = new Resend(apiKey);
        this.mailFrom = mailFrom;
        this.passwordResetOtpExpiryMinutes = passwordResetOtpExpiryMinutes;
        this.emailVerificationOtpExpiryMinutes = emailVerificationOtpExpiryMinutes;
    }

    @Override
    public void sendPasswordResetOtp(String toEmail, String otp) {
        String html = """
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                  <h2 style="color: #1a1a1a;">Lì He Men's Hair Designer — Đặt lại mật khẩu</h2>
                  <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Lì He Men's Hair Designer của mình.</p>
                  <p>Mã xác thực của bạn là:</p>
                  <div style="text-align: center; padding: 20px; background-color: #f3f3f3;
                    border-radius: 8px; font-size: 32px; font-weight: 700; letter-spacing: 8px; margin: 16px 0;">
                    %s
                  </div>
                  <p style="margin-top: 24px; font-size: 14px; color: #666;">
                    Mã này sẽ hết hạn sau %d phút.<br/>
                    Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
                  </p>
                </div>
                """.formatted(passwordResetOtpExpiryMinutes, otp);

        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(mailFrom)
                    .to(toEmail)
                    .subject("Mã đặt lại mật khẩu Lì He Men's Hair Designer")
                    .html(html)
                    .build();

            String emailId = resend.emails().send(params).getId();
            log.info("Password reset OTP sent to {} — Resend ID: {}", toEmail, emailId);
        } catch (ResendException e) {
            log.error("Failed to send password reset OTP to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send email", e);
        }
    }

    @Override
    public void sendRegistrationOtp(String toEmail, String otp) {
        String html = """
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                  <h2 style="color: #1a1a1a;">Lì He Men's Hair Designer — Xác thực tài khoản</h2>
                  <p>Cảm ơn bạn đã đăng ký tài khoản tại Lì He Men's Hair Designer.</p>
                  <p>Mã xác thực của bạn là:</p>
                  <div style="text-align: center; padding: 20px; background-color: #f3f3f3;
                    border-radius: 8px; font-size: 32px; font-weight: 700; letter-spacing: 8px; margin: 16px 0;">
                    %s
                  </div>
                  <p style="margin-top: 24px; font-size: 14px; color: #666;">
                    Mã này sẽ hết hạn sau %d phút.<br/>
                    Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email.
                  </p>
                </div>
                """.formatted(emailVerificationOtpExpiryMinutes, otp);

        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(mailFrom)
                    .to(toEmail)
                    .subject("Mã xác thực tài khoản Lì He Men's Hair Designer")
                    .html(html)
                    .build();

            String emailId = resend.emails().send(params).getId();
            log.info("Registration OTP sent to {} — Resend ID: {}", toEmail, emailId);
        } catch (ResendException e) {
            log.error("Failed to send registration OTP to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send email", e);
        }
    }
}
