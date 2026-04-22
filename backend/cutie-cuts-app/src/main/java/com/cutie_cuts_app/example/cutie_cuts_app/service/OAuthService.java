package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.AuthResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.OAuthUserInfo;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.UserResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.UserAuth;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserAuthRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.security.FacebookTokenVerifier;
import com.cutie_cuts_app.example.cutie_cuts_app.security.GoogleTokenVerifier;
import com.cutie_cuts_app.example.cutie_cuts_app.security.JwtUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class OAuthService {

    private final GoogleTokenVerifier googleTokenVerifier;
    private final FacebookTokenVerifier facebookTokenVerifier;
    private final UserAuthRepository userAuthRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public OAuthService(
            GoogleTokenVerifier googleTokenVerifier,
            FacebookTokenVerifier facebookTokenVerifier,
            UserAuthRepository userAuthRepository,
            UserRepository userRepository,
            JwtUtil jwtUtil) {
        this.googleTokenVerifier = googleTokenVerifier;
        this.facebookTokenVerifier = facebookTokenVerifier;
        this.userAuthRepository = userAuthRepository;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public AuthResponse authenticate(String provider, String token) {
        String normalizedProvider = normalizeProvider(provider);
        OAuthUserInfo oauthInfo = verifyToken(normalizedProvider, token);
        String authValue = normalizedProvider + ":" + oauthInfo.providerId();

        // Case 1: User already linked this OAuth provider → login
        UserAuth existingAuth = userAuthRepository
                .findByAuthTypeAndAuthValue(normalizedProvider, authValue)
                .orElse(null);

        if (existingAuth != null) {
            ensureActiveUser(existingAuth.getUser());
            String email = oauthInfo.email() != null ? oauthInfo.email()
                    : findEmailFromAuthMethods(existingAuth.getUser());
            return new AuthResponse(
                    jwtUtil.generateToken(email != null ? email : authValue),
                    UserResponse.from(existingAuth.getUser(), email != null ? email : authValue));
        }

        // Case 2: Try to link with existing account by matching email
        if (oauthInfo.email() != null) {
            UserAuth emailAuth = userAuthRepository
                    .findByAuthTypeAndAuthValue("email", oauthInfo.email().toLowerCase())
                    .orElse(null);

            if (emailAuth != null) {
                ensureActiveUser(emailAuth.getUser());
                // Link OAuth to existing user
                linkOAuthProvider(emailAuth.getUser(), normalizedProvider, authValue);
                return new AuthResponse(
                        jwtUtil.generateToken(oauthInfo.email()),
                        UserResponse.from(emailAuth.getUser(), oauthInfo.email()));
            }
        }

        // Case 3: New user → create account
        User newUser = new User();
        newUser.setName(oauthInfo.name() != null ? oauthInfo.name() : "User");

        UserAuth oauthAuthMethod = new UserAuth();
        oauthAuthMethod.setAuthType(normalizedProvider);
        oauthAuthMethod.setAuthValue(authValue);
        oauthAuthMethod.setVerified(true);
        oauthAuthMethod.setUser(newUser);

        // Also store email as a separate auth method if available
        if (oauthInfo.email() != null) {
            UserAuth emailAuthMethod = new UserAuth();
            emailAuthMethod.setAuthType("email");
            emailAuthMethod.setAuthValue(oauthInfo.email().toLowerCase());
            emailAuthMethod.setPasswordHash(null); // No password for OAuth-created accounts
            emailAuthMethod.setVerified(true);
            emailAuthMethod.setUser(newUser);
            newUser.setAuthMethods(List.of(oauthAuthMethod, emailAuthMethod));
        } else {
            newUser.setAuthMethods(List.of(oauthAuthMethod));
        }

        User savedUser = userRepository.save(newUser);
        String emailForToken = oauthInfo.email() != null ? oauthInfo.email() : authValue;

        return new AuthResponse(
                jwtUtil.generateToken(emailForToken),
                UserResponse.from(savedUser, emailForToken));
    }

    private OAuthUserInfo verifyToken(String provider, String token) {
        return switch (provider) {
            case "google" -> googleTokenVerifier.verify(token);
            case "facebook" -> facebookTokenVerifier.verify(token);
            default -> throw new ResponseStatusException(BAD_REQUEST, "Unsupported OAuth provider: " + provider);
        };
    }

    private String normalizeProvider(String provider) {
        if (provider == null || provider.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Provider is required");
        }
        String normalized = provider.trim().toLowerCase();
        if (!normalized.equals("google") && !normalized.equals("facebook")) {
            throw new ResponseStatusException(BAD_REQUEST, "Unsupported provider. Use 'google' or 'facebook'");
        }
        return normalized;
    }

    private void linkOAuthProvider(User user, String provider, String authValue) {
        UserAuth oauthAuth = new UserAuth();
        oauthAuth.setAuthType(provider);
        oauthAuth.setAuthValue(authValue);
        oauthAuth.setVerified(true);
        oauthAuth.setUser(user);

        List<UserAuth> methods = user.getAuthMethods();
        methods.add(oauthAuth);
        user.setAuthMethods(methods);
        userRepository.save(user);
    }

    private void ensureActiveUser(User user) {
        if (Boolean.TRUE.equals(user.getDeleted())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Account has been deactivated");
        }
    }

    private String findEmailFromAuthMethods(User user) {
        if (user.getAuthMethods() == null)
            return null;
        return user.getAuthMethods().stream()
                .filter(auth -> "email".equals(auth.getAuthType()))
                .map(UserAuth::getAuthValue)
                .findFirst()
                .orElse(null);
    }
}