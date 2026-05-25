package com.cutie_cuts_app.example.cutie_cuts_app.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_auth", uniqueConstraints = @UniqueConstraint(columnNames = {"auth_type", "auth_value"}), indexes = {
    @Index(name = "idx_user_auth_user", columnList = "user_id")
})
public class UserAuth {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "auth_type", nullable = false)
    private String authType;

    @Column(name = "auth_value", nullable = false)
    private String authValue;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = true;

    @Column(name = "reset_otp_hash")
    private String resetOtpHash;

    @Column(name = "reset_otp_expiry")
    private LocalDateTime resetOtpExpiry;

    @Column(name = "reset_otp_attempts", nullable = false)
    private int resetOtpAttempts;

    @Column(name = "reset_otp_last_sent_at")
    private LocalDateTime resetOtpLastSentAt;

    @Column(name = "verification_otp_hash")
    private String verificationOtpHash;

    @Column(name = "verification_otp_expiry")
    private LocalDateTime verificationOtpExpiry;

    @Column(name = "verification_otp_attempts", nullable = false)
    private int verificationOtpAttempts;

    @Column(name = "verification_otp_last_sent_at")
    private LocalDateTime verificationOtpLastSentAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public Long getId() { return id; }

    public String getAuthType() { return authType; }
    public void setAuthType(String authType) { this.authType = authType; }

    public String getAuthValue() { return authValue; }
    public void setAuthValue(String authValue) { this.authValue = authValue; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }

    public String getResetOtpHash() { return resetOtpHash; }
    public void setResetOtpHash(String resetOtpHash) { this.resetOtpHash = resetOtpHash; }

    public LocalDateTime getResetOtpExpiry() { return resetOtpExpiry; }
    public void setResetOtpExpiry(LocalDateTime resetOtpExpiry) { this.resetOtpExpiry = resetOtpExpiry; }

    public int getResetOtpAttempts() { return resetOtpAttempts; }
    public void setResetOtpAttempts(int resetOtpAttempts) { this.resetOtpAttempts = resetOtpAttempts; }

    public LocalDateTime getResetOtpLastSentAt() { return resetOtpLastSentAt; }
    public void setResetOtpLastSentAt(LocalDateTime resetOtpLastSentAt) { this.resetOtpLastSentAt = resetOtpLastSentAt; }

    public String getVerificationOtpHash() { return verificationOtpHash; }
    public void setVerificationOtpHash(String verificationOtpHash) { this.verificationOtpHash = verificationOtpHash; }

    public LocalDateTime getVerificationOtpExpiry() { return verificationOtpExpiry; }
    public void setVerificationOtpExpiry(LocalDateTime verificationOtpExpiry) { this.verificationOtpExpiry = verificationOtpExpiry; }

    public int getVerificationOtpAttempts() { return verificationOtpAttempts; }
    public void setVerificationOtpAttempts(int verificationOtpAttempts) { this.verificationOtpAttempts = verificationOtpAttempts; }

    public LocalDateTime getVerificationOtpLastSentAt() { return verificationOtpLastSentAt; }
    public void setVerificationOtpLastSentAt(LocalDateTime verificationOtpLastSentAt) { this.verificationOtpLastSentAt = verificationOtpLastSentAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
