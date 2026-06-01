package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.AuthResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.ForgotPasswordRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.LoginRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.OAuthLoginRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.RegisterRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.ResendVerificationOtpRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.ResetPasswordRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.VerifyEmailOtpRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.service.AuthService;
import com.cutie_cuts_app.example.cutie_cuts_app.service.OAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:5173", "http://localhost", "http://localhost:80"})
@Tag(name = "Authentication", description = "Login, register, OTP verification, and OAuth endpoints")
public class AuthController {

    private final AuthService authService;
    private final OAuthService oAuthService;

    public AuthController(AuthService authService, OAuthService oAuthService) {
        this.authService = authService;
        this.oAuthService = oAuthService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register new user", description = "Creates a new account and sends a verification OTP email")
    @ApiResponse(responseCode = "201", description = "Registration successful, verification email sent")
    @ApiResponse(responseCode = "400", description = "Invalid input")
    @ApiResponse(responseCode = "409", description = "Email already exists")
    public Map<String, String> register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticates with email/password. Requires email to be verified.")
    @ApiResponse(responseCode = "200", description = "Login successful",
            content = @Content(schema = @Schema(implementation = AuthResponse.class)))
    @ApiResponse(responseCode = "401", description = "Invalid email or password")
    @ApiResponse(responseCode = "403", description = "Email is not verified")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Forgot password", description = "Sends a password reset OTP if the email exists")
    @ApiResponse(responseCode = "200", description = "Reset OTP sent if account exists")
    public Map<String, String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return Map.of("message", "If this email exists, a reset code has been sent.");
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password", description = "Resets password using OTP from email")
    @ApiResponse(responseCode = "200", description = "Password reset successfully")
    @ApiResponse(responseCode = "400", description = "Invalid or expired OTP")
    public Map<String, String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getEmail(), request.getOtp(), request.getNewPassword());
        return Map.of("message", "Password has been reset successfully.");
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Verify email", description = "Verifies email using OTP sent after registration")
    @ApiResponse(responseCode = "200", description = "Email verified successfully")
    @ApiResponse(responseCode = "400", description = "Invalid or expired verification code")
    public Map<String, String> verifyEmail(@Valid @RequestBody VerifyEmailOtpRequest request) {
        return authService.verifyEmail(request.getEmail(), request.getOtp());
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Resend verification OTP", description = "Resends the email verification OTP")
    @ApiResponse(responseCode = "200", description = "Verification OTP resent if eligible")
    public Map<String, String> resendVerification(@Valid @RequestBody ResendVerificationOtpRequest request) {
        authService.resendVerificationOtp(request.getEmail());
        return Map.of("message", "If this email needs verification, a new code has been sent.");
    }

    @PostMapping("/oauth")
    @Operation(summary = "OAuth login", description = "Authenticates via Google or Facebook OAuth token")
    @ApiResponse(responseCode = "200", description = "OAuth login successful",
            content = @Content(schema = @Schema(implementation = AuthResponse.class)))
    @ApiResponse(responseCode = "401", description = "Invalid OAuth token")
    public AuthResponse oauthLogin(@RequestBody OAuthLoginRequest request) {
        return oAuthService.authenticate(request.getProvider(), request.getToken());
    }
}
