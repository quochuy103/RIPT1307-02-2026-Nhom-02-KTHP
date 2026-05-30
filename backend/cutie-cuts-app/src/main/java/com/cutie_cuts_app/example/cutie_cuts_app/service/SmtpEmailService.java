package com.cutie_cuts_app.example.cutie_cuts_app.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Service
@ConditionalOnProperty(name = "app.mail.provider", havingValue = "smtp")
public class SmtpEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(SmtpEmailService.class);

    private static final String DISPLAY_NAME = "CutieCuts";

    private final JavaMailSender mailSender;
    private final InternetAddress fromAddress;
    private final int passwordResetOtpExpiryMinutes;
    private final int emailVerificationOtpExpiryMinutes;

    public SmtpEmailService(
            JavaMailSender mailSender,
            @Value("${spring.mail.username}") String smtpUsername,
            @Value("${app.password-reset.otp-expiry-minutes}") int passwordResetOtpExpiryMinutes,
            @Value("${app.email-verification.otp-expiry-minutes}") int emailVerificationOtpExpiryMinutes)
            throws UnsupportedEncodingException {
        this.mailSender = mailSender;
        this.fromAddress = new InternetAddress(smtpUsername, DISPLAY_NAME, "UTF-8");
        this.passwordResetOtpExpiryMinutes = passwordResetOtpExpiryMinutes;
        this.emailVerificationOtpExpiryMinutes = emailVerificationOtpExpiryMinutes;
    }

    @Override
    public void sendPasswordResetOtp(String toEmail, String otp) {
        String subject = "CutieCuts – Đặt lại mật khẩu";

        String plainText = """
                Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản CutieCuts của mình.

                Mã đặt lại mật khẩu: %s

                Mã này sẽ hết hạn sau %d phút.

                Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.

                --
                CutieCuts
                """.formatted(otp, passwordResetOtpExpiryMinutes);

        String html = """
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                  <h2 style="color: #1a1a1a;">CutieCuts – Đặt lại mật khẩu</h2>
                  <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản CutieCuts của mình.</p>
                  <p style="margin-bottom: 4px;">Mã đặt lại mật khẩu:</p>
                  <div style="text-align: center; padding: 20px; background-color: #f3f3f3;
                    border-radius: 8px; font-size: 32px; font-weight: 700; letter-spacing: 8px; margin: 8px 0 16px 0;">
                    %s
                  </div>
                  <p style="font-size: 14px; color: #666;">
                    Mã này sẽ hết hạn sau %d phút.
                  </p>
                  <p style="margin-top: 24px; font-size: 13px; color: #888;">
                    Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
                  </p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
                  <p style="font-size: 12px; color: #aaa;">CutieCuts</p>
                </div>
                """.formatted(otp, passwordResetOtpExpiryMinutes);

        sendEmail(toEmail, subject, plainText, html, "password reset");
    }

    @Override
    public void sendRegistrationOtp(String toEmail, String otp) {
        String subject = "CutieCuts – Mã xác thực tài khoản";

        String plainText = """
                Cảm ơn bạn đã đăng ký tài khoản tại CutieCuts.

                Mã xác thực của bạn: %s

                Mã này sẽ hết hạn sau %d phút.

                Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.

                --
                CutieCuts
                """.formatted(otp, emailVerificationOtpExpiryMinutes);

        String html = """
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                  <h2 style="color: #1a1a1a;">CutieCuts – Xác thực tài khoản</h2>
                  <p>Cảm ơn bạn đã đăng ký tài khoản tại CutieCuts.</p>
                  <p style="margin-bottom: 4px;">Mã xác thực của bạn:</p>
                  <div style="text-align: center; padding: 20px; background-color: #f3f3f3;
                    border-radius: 8px; font-size: 32px; font-weight: 700; letter-spacing: 8px; margin: 8px 0 16px 0;">
                    %s
                  </div>
                  <p style="font-size: 14px; color: #666;">
                    Mã này sẽ hết hạn sau %d phút.
                  </p>
                  <p style="margin-top: 24px; font-size: 13px; color: #888;">
                    Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email.
                  </p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
                  <p style="font-size: 12px; color: #aaa;">CutieCuts</p>
                </div>
                """.formatted(otp, emailVerificationOtpExpiryMinutes);

        sendEmail(toEmail, subject, plainText, html, "registration");
    }

    private void sendEmail(String to, String subject, String plainText, String html, String purpose) {
        try {
            MimeMessage message = mailSender.createMimeMessage();

            MimeMultipart multipart = new MimeMultipart("alternative");

            MimeBodyPart textPart = new MimeBodyPart();
            textPart.setText(plainText, "UTF-8", "plain");
            multipart.addBodyPart(textPart);

            MimeBodyPart htmlPart = new MimeBodyPart();
            htmlPart.setText(html, "UTF-8", "html");
            multipart.addBodyPart(htmlPart);

            message.setFrom(fromAddress);
            message.setRecipients(MimeMessage.RecipientType.TO, to);
            message.setSubject(subject);
            message.setContent(multipart);

            mailSender.send(message);
            log.info("{} OTP email sent to {}", purpose, to);
        } catch (MessagingException e) {
            log.error("Failed to send {} OTP email to {}: {}", purpose, to, e.getMessage());
            throw new RuntimeException("Failed to send email", e);
        }
    }
}
