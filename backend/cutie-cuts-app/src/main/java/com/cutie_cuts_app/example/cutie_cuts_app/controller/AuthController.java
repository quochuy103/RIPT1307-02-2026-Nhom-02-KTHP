package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.AuthResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.LoginRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.OAuthLoginRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.RegisterRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.service.AuthService;
import com.cutie_cuts_app.example.cutie_cuts_app.service.OAuthService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = { "http://localhost:8080", "http://localhost:5173", "http://localhost", "http://localhost:80" })
public class AuthController {

    private final AuthService authService;
    private final OAuthService oAuthService;

    public AuthController(AuthService authService, OAuthService oAuthService) {
        this.authService = authService;
        this.oAuthService = oAuthService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/oauth")
    public AuthResponse oauthLogin(@RequestBody OAuthLoginRequest request) {
        return oAuthService.authenticate(request.getProvider(), request.getToken());
    }
}
