package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.RevokedToken;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.RevokedTokenRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TokenRevocationServiceTest {

    @Mock
    private RevokedTokenRepository revokedTokenRepository;

    @Mock
    private JwtUtil jwtUtil;

    private TokenRevocationService tokenRevocationService;

    @BeforeEach
    void setUp() {
        tokenRevocationService = new TokenRevocationService(revokedTokenRepository, jwtUtil);
    }

    @Test
    void isTokenInvalidatedReturnsTrueWhenTokenIdIsBlacklisted() {
        User user = createUser(1L);

        when(jwtUtil.extractTokenId("jwt-token")).thenReturn("jti-1");
        when(revokedTokenRepository.existsByJti("jti-1")).thenReturn(true);

        assertTrue(tokenRevocationService.isTokenInvalidated("jwt-token", user));
    }

    @Test
    void isTokenInvalidatedReturnsTrueWhenPasswordChangedAfterTokenIssued() {
        User user = createUser(1L);
        user.setCredentialsUpdatedAt(LocalDateTime.of(2026, 5, 24, 21, 0));
        Date issuedAt = Date.from(LocalDateTime.of(2026, 5, 24, 20, 0)
                .atZone(ZoneId.systemDefault())
                .toInstant());

        when(jwtUtil.extractIssuedAt("jwt-token")).thenReturn(issuedAt);

        assertTrue(tokenRevocationService.isTokenInvalidated("jwt-token", user));
    }

    @Test
    void isTokenInvalidatedReturnsTrueWhenTokenIssuedExactlyAtCredentialsUpdateTime() {
        User user = createUser(1L);
        LocalDateTime credentialsUpdatedAt = LocalDateTime.of(2026, 5, 24, 21, 0);
        user.setCredentialsUpdatedAt(credentialsUpdatedAt);
        Date issuedAt = Date.from(credentialsUpdatedAt.atZone(ZoneId.systemDefault()).toInstant());

        when(jwtUtil.extractIssuedAt("jwt-token")).thenReturn(issuedAt);

        assertTrue(tokenRevocationService.isTokenInvalidated("jwt-token", user));
    }

    @Test
    void revokeBearerTokenPersistsTokenIdAndExpiration() {
        User user = createUser(1L);
        Date expiration = Date.from(LocalDateTime.of(2026, 5, 25, 21, 0)
                .atZone(ZoneId.systemDefault())
                .toInstant());

        when(jwtUtil.extractTokenId("jwt-token")).thenReturn("jti-1");
        when(jwtUtil.extractExpiration("jwt-token")).thenReturn(expiration);
        when(revokedTokenRepository.existsByJti("jti-1")).thenReturn(false);

        tokenRevocationService.revokeBearerToken("Bearer jwt-token", user, "PASSWORD_CHANGED");

        ArgumentCaptor<RevokedToken> captor = ArgumentCaptor.forClass(RevokedToken.class);
        verify(revokedTokenRepository).save(captor.capture());
        assertEquals("jti-1", captor.getValue().getJti());
        assertEquals("PASSWORD_CHANGED", captor.getValue().getReason());
        assertEquals(user, captor.getValue().getUser());
    }

    private User createUser(Long id) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", id);
        user.setName("Customer");
        user.setDeleted(false);
        return user;
    }
}
