package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.AuthResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.LoginRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.RegisterRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.UserResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.UserAuth;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserAuthRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserAuthRepository userAuthRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final TokenService tokenService;
    private final EmailService emailService;
    private final int passwordResetOtpExpiryMinutes;
    private final int passwordResetMaxAttempts;
    private final int passwordResetResendCooldownSeconds;
    private final int emailVerificationOtpExpiryMinutes;
    private final int emailVerificationMaxAttempts;
    private final int emailVerificationResendCooldownSeconds;

    public AuthService(
            UserRepository userRepository,
            UserAuthRepository userAuthRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            TokenService tokenService,
            EmailService emailService,
            @Value("${app.password-reset.otp-expiry-minutes}") int passwordResetOtpExpiryMinutes,
            @Value("${app.password-reset.max-attempts}") int passwordResetMaxAttempts,
            @Value("${app.password-reset.resend-cooldown-seconds}") int passwordResetResendCooldownSeconds,
            @Value("${app.email-verification.otp-expiry-minutes}") int emailVerificationOtpExpiryMinutes,
            @Value("${app.email-verification.max-attempts}") int emailVerificationMaxAttempts,
            @Value("${app.email-verification.resend-cooldown-seconds}") int emailVerificationResendCooldownSeconds
    ) {
        this.userRepository = userRepository;
        this.userAuthRepository = userAuthRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.tokenService = tokenService;
        this.emailService = emailService;
        this.passwordResetOtpExpiryMinutes = passwordResetOtpExpiryMinutes;
        this.passwordResetMaxAttempts = passwordResetMaxAttempts;
        this.passwordResetResendCooldownSeconds = passwordResetResendCooldownSeconds;
        this.emailVerificationOtpExpiryMinutes = emailVerificationOtpExpiryMinutes;
        this.emailVerificationMaxAttempts = emailVerificationMaxAttempts;
        this.emailVerificationResendCooldownSeconds = emailVerificationResendCooldownSeconds;
    }

    // ── Registration ────────────────────────────────────────────────────

    public Map<String, String> register(RegisterRequest request) {
        String name = requireValue(request.getName(), "Name is required");
        String email = normalizeEmail(request.getEmail());
        String password = requireValue(request.getPassword(), "Password is required");

        if (userAuthRepository.findByAuthTypeAndAuthValue("email", email).isPresent()) {
            throw new ResponseStatusException(CONFLICT, "Email already exists");
        }

        User user = new User();
        user.setName(name);

        UserAuth auth = new UserAuth();
        auth.setAuthType("email");
        auth.setAuthValue(email);
        auth.setPasswordHash(passwordEncoder.encode(password));
        auth.setEmailVerified(false);
        auth.setUser(user);

        String otp = tokenService.generateOtp();
        auth.setVerificationOtpHash(tokenService.hashOtp(
                TokenService.PURPOSE_EMAIL_VERIFY, email, otp));
        auth.setVerificationOtpExpiry(LocalDateTime.now().plusMinutes(emailVerificationOtpExpiryMinutes));
        auth.setVerificationOtpAttempts(0);
        auth.setVerificationOtpLastSentAt(LocalDateTime.now());

        user.setAuthMethods(List.of(auth));

        emailService.sendRegistrationOtp(email, otp);

        userRepository.save(user);

        return Map.of("message", "Registration successful. Please check your email for a verification code.");
    }

    // ── Login ───────────────────────────────────────────────────────────

    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        String password = requireValue(request.getPassword(), "Password is required");

        UserAuth auth = userAuthRepository
                .findByAuthTypeAndAuthValue("email", email)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Invalid email or password"));

        if (!passwordEncoder.matches(password, auth.getPasswordHash())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Invalid email or password");
        }

        if (!auth.isEmailVerified()) {
            throw new ResponseStatusException(FORBIDDEN, "Email is not verified");
        }

        ensureActiveUser(auth.getUser());

        return new AuthResponse(jwtUtil.generateToken(email), UserResponse.from(auth.getUser(), email));
    }

    // ── Current user ────────────────────────────────────────────────────

    public UserResponse getCurrentUser(String email) {
        UserAuth auth = userAuthRepository
                .findByAuthTypeAndAuthValue("email", normalizeEmail(email))
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "User not found"));

        ensureActiveUser(auth.getUser());

        return UserResponse.from(auth.getUser(), auth.getAuthValue());
    }

    // ── Password reset OTP ──────────────────────────────────────────────

    public void forgotPassword(String email) {
        String normalizedEmail = normalizeEmail(email);

        Optional<UserAuth> authOpt = userAuthRepository
                .findByAuthTypeAndAuthValue("email", normalizedEmail);
        if (authOpt.isEmpty()) {
            return;
        }

        UserAuth auth = authOpt.get();

        if (auth.getResetOtpLastSentAt() != null &&
                auth.getResetOtpLastSentAt().plusSeconds(passwordResetResendCooldownSeconds)
                        .isAfter(LocalDateTime.now())) {
            return;
        }

        String otp = tokenService.generateOtp();
        auth.setResetOtpHash(tokenService.hashOtp(
                TokenService.PURPOSE_PASSWORD_RESET, normalizedEmail, otp));
        auth.setResetOtpExpiry(LocalDateTime.now().plusMinutes(passwordResetOtpExpiryMinutes));
        auth.setResetOtpAttempts(0);
        auth.setResetOtpLastSentAt(LocalDateTime.now());
        userAuthRepository.save(auth);

        emailService.sendPasswordResetOtp(normalizedEmail, otp);
    }

    public void resetPassword(String email, String otp, String newPassword) {
        String normalizedEmail = normalizeEmail(email);

        UserAuth auth = userAuthRepository
                .findByAuthTypeAndAuthValue("email", normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Invalid or expired reset code"));

        if (auth.getResetOtpHash() == null || auth.getResetOtpExpiry() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid or expired reset code");
        }

        if (auth.getResetOtpAttempts() >= passwordResetMaxAttempts) {
            throw new ResponseStatusException(BAD_REQUEST, "Too many attempts. Request a new reset code.");
        }

        if (LocalDateTime.now().isAfter(auth.getResetOtpExpiry())) {
            auth.setResetOtpHash(null);
            auth.setResetOtpExpiry(null);
            auth.setResetOtpAttempts(0);
            userAuthRepository.save(auth);
            throw new ResponseStatusException(BAD_REQUEST, "Invalid or expired reset code");
        }

        String otpHash = tokenService.hashOtp(
                TokenService.PURPOSE_PASSWORD_RESET, normalizedEmail, otp);

        if (!otpHash.equals(auth.getResetOtpHash())) {
            auth.setResetOtpAttempts(auth.getResetOtpAttempts() + 1);
            userAuthRepository.save(auth);
            throw new ResponseStatusException(BAD_REQUEST, "Invalid or expired reset code");
        }

        auth.setPasswordHash(passwordEncoder.encode(newPassword));
        auth.setResetOtpHash(null);
        auth.setResetOtpExpiry(null);
        auth.setResetOtpAttempts(0);
        auth.setResetOtpLastSentAt(null);
        userAuthRepository.save(auth);
    }

    // ── Email verification ──────────────────────────────────────────────

    public Map<String, String> verifyEmail(String email, String otp) {
        String normalizedEmail = normalizeEmail(email);

        UserAuth auth = userAuthRepository
                .findByAuthTypeAndAuthValue("email", normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Invalid or expired verification code"));

        if (auth.isEmailVerified()) {
            return Map.of("message", "Email already verified");
        }

        if (auth.getVerificationOtpHash() == null || auth.getVerificationOtpExpiry() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid or expired verification code");
        }

        if (auth.getVerificationOtpAttempts() >= emailVerificationMaxAttempts) {
            throw new ResponseStatusException(BAD_REQUEST, "Too many attempts. Request a new verification code.");
        }

        if (LocalDateTime.now().isAfter(auth.getVerificationOtpExpiry())) {
            auth.setVerificationOtpHash(null);
            auth.setVerificationOtpExpiry(null);
            auth.setVerificationOtpAttempts(0);
            userAuthRepository.save(auth);
            throw new ResponseStatusException(BAD_REQUEST, "Invalid or expired verification code");
        }

        String otpHash = tokenService.hashOtp(
                TokenService.PURPOSE_EMAIL_VERIFY, normalizedEmail, otp);

        if (!otpHash.equals(auth.getVerificationOtpHash())) {
            auth.setVerificationOtpAttempts(auth.getVerificationOtpAttempts() + 1);
            userAuthRepository.save(auth);
            throw new ResponseStatusException(BAD_REQUEST, "Invalid or expired verification code");
        }

        auth.setEmailVerified(true);
        auth.setVerificationOtpHash(null);
        auth.setVerificationOtpExpiry(null);
        auth.setVerificationOtpAttempts(0);
        auth.setVerificationOtpLastSentAt(null);
        userAuthRepository.save(auth);

        return Map.of("message", "Email verified successfully");
    }

    public void resendVerificationOtp(String email) {
        String normalizedEmail = normalizeEmail(email);

        Optional<UserAuth> authOpt = userAuthRepository
                .findByAuthTypeAndAuthValue("email", normalizedEmail);
        if (authOpt.isEmpty()) {
            return;
        }

        UserAuth auth = authOpt.get();

        if (auth.isEmailVerified()) {
            return;
        }

        if (auth.getVerificationOtpLastSentAt() != null &&
                auth.getVerificationOtpLastSentAt().plusSeconds(emailVerificationResendCooldownSeconds)
                        .isAfter(LocalDateTime.now())) {
            return;
        }

        String otp = tokenService.generateOtp();
        auth.setVerificationOtpHash(tokenService.hashOtp(
                TokenService.PURPOSE_EMAIL_VERIFY, normalizedEmail, otp));
        auth.setVerificationOtpExpiry(LocalDateTime.now().plusMinutes(emailVerificationOtpExpiryMinutes));
        auth.setVerificationOtpAttempts(0);
        auth.setVerificationOtpLastSentAt(LocalDateTime.now());
        userAuthRepository.save(auth);

        emailService.sendRegistrationOtp(normalizedEmail, otp);
    }

    // ── Helpers ─────────────────────────────────────────────────────────

    private void ensureActiveUser(User user) {
        if (Boolean.TRUE.equals(user.getDeleted())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Account has been deactivated");
        }
    }

    private String normalizeEmail(String email) {
        String value = requireValue(email, "Email is required").toLowerCase();
        if (!value.contains("@")) {
            throw new ResponseStatusException(BAD_REQUEST, "Email is invalid");
        }
        return value;
    }

    private String requireValue(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, message);
        }
        return value.trim();
    }
}
