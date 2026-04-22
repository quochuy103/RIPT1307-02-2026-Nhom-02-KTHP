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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserAuthRepository userAuthRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(
            UserRepository userRepository,
            UserAuthRepository userAuthRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil
    ) {
        this.userRepository = userRepository;
        this.userAuthRepository = userAuthRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse register(RegisterRequest request) {
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
        auth.setVerified(true);
        auth.setUser(user);

        user.setAuthMethods(List.of(auth));

        User savedUser = userRepository.save(user);
        return new AuthResponse(jwtUtil.generateToken(email), UserResponse.from(savedUser, email));
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        String password = requireValue(request.getPassword(), "Password is required");

        UserAuth auth = userAuthRepository
                .findByAuthTypeAndAuthValue("email", email)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Invalid email or password"));

        if (!passwordEncoder.matches(password, auth.getPasswordHash())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Invalid email or password");
        }

        ensureActiveUser(auth.getUser());

        return new AuthResponse(jwtUtil.generateToken(email), UserResponse.from(auth.getUser(), email));
    }

    public UserResponse getCurrentUser(String email) {
        UserAuth auth = userAuthRepository
                .findByAuthTypeAndAuthValue("email", normalizeEmail(email))
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "User not found"));

        ensureActiveUser(auth.getUser());

        return UserResponse.from(auth.getUser(), auth.getAuthValue());
    }

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
