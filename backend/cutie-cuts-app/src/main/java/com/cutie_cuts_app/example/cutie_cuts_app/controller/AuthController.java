package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.AuthResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.LoginRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.OAuthLoginRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.RegisterRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.service.AuthService;
import com.cutie_cuts_app.example.cutie_cuts_app.service.OAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:5173", "http://localhost", "http://localhost:80"})
@Tag(name = "Authentication", description = "Login, register, and OAuth endpoints")
public class AuthController {

    private final AuthService authService;
    private final OAuthService oAuthService;

    public AuthController(AuthService authService, OAuthService oAuthService) {
        this.authService = authService;
        this.oAuthService = oAuthService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register new user", description = "Creates a new user account and returns a JWT token")
    @ApiResponse(responseCode = "201", description = "User registered successfully",
            content = @Content(schema = @Schema(implementation = AuthResponse.class)))
    @ApiResponse(responseCode = "400", description = "Invalid input or email already exists")
    public AuthResponse register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticates with email/password and returns a JWT token. Use the token in the Authorize button above.")
    @ApiResponse(responseCode = "200", description = "Login successful",
            content = @Content(schema = @Schema(implementation = AuthResponse.class)))
    @ApiResponse(responseCode = "401", description = "Invalid email or password")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
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
