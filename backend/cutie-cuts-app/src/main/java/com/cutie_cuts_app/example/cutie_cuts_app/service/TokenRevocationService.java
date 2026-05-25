package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.RevokedToken;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.RevokedTokenRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.security.JwtUtil;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

@Service
public class TokenRevocationService {

    private final RevokedTokenRepository revokedTokenRepository;
    private final JwtUtil jwtUtil;

    public TokenRevocationService(RevokedTokenRepository revokedTokenRepository, JwtUtil jwtUtil) {
        this.revokedTokenRepository = revokedTokenRepository;
        this.jwtUtil = jwtUtil;
    }

    public boolean isTokenInvalidated(String token, User user) {
        if (wasIssuedBeforeCredentialsUpdate(token, user)) {
            return true;
        }

        String tokenId = jwtUtil.extractTokenId(token);
        return tokenId != null && revokedTokenRepository.existsByJti(tokenId);
    }

    public void revokeBearerToken(String authorizationHeader, User user, String reason) {
        String token = extractBearerToken(authorizationHeader);
        if (token == null || user == null) {
            return;
        }

        try {
            revokeToken(token, user, reason);
        } catch (Exception ignored) {
            // Credentials timestamp still invalidates old tokens even if this token cannot be persisted.
        }
    }

    private boolean wasIssuedBeforeCredentialsUpdate(String token, User user) {
        if (user == null || user.getCredentialsUpdatedAt() == null) {
            return false;
        }

        Date issuedAt = jwtUtil.extractIssuedAt(token);
        if (issuedAt == null) {
            return false;
        }

        LocalDateTime tokenIssuedAt = LocalDateTime.ofInstant(issuedAt.toInstant(), ZoneId.systemDefault());
        return !tokenIssuedAt.isAfter(user.getCredentialsUpdatedAt());
    }

    private void revokeToken(String token, User user, String reason) {
        String tokenId = jwtUtil.extractTokenId(token);
        Date expiration = jwtUtil.extractExpiration(token);

        if (tokenId == null || tokenId.isBlank() || expiration == null || revokedTokenRepository.existsByJti(tokenId)) {
            return;
        }

        RevokedToken revokedToken = new RevokedToken();
        revokedToken.setJti(tokenId);
        revokedToken.setReason(reason);
        revokedToken.setUser(user);
        revokedToken.setExpiresAt(LocalDateTime.ofInstant(expiration.toInstant(), ZoneId.systemDefault()));
        revokedTokenRepository.save(revokedToken);
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return null;
        }
        return authorizationHeader.substring(7).trim();
    }
}
