package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.ChangePasswordRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.UserAuth;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserAuthRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserAuthRepository userAuthRepository;

    @Mock
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private TokenRevocationService tokenRevocationService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                userAuthRepository,
                passwordEncoder,
                jwtUtil,
                tokenRevocationService);
    }

    @Test
    void changePasswordUpdatesHashAndInvalidatesExistingToken() {
        User user = createUser(1L, "Customer");
        UserAuth auth = createEmailAuth(user, "user@example.com", "hashed-old");
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("old-pass");
        request.setNewPassword("new-pass");

        when(userAuthRepository.findByAuthTypeAndAuthValue("email", "user@example.com"))
                .thenReturn(Optional.of(auth));
        when(passwordEncoder.matches("old-pass", "hashed-old")).thenReturn(true);
        when(passwordEncoder.matches("new-pass", "hashed-old")).thenReturn(false);
        when(passwordEncoder.encode("new-pass")).thenReturn("hashed-new");

        authService.changePassword("user@example.com", request, "Bearer jwt-token");

        assertEquals("hashed-new", auth.getPasswordHash());
        assertNotNull(user.getCredentialsUpdatedAt());
        verify(userAuthRepository).save(auth);
        verify(userRepository).save(user);
        verify(tokenRevocationService).revokeBearerToken("Bearer jwt-token", user, "PASSWORD_CHANGED");
    }

    @Test
    void changePasswordRejectsWrongCurrentPassword() {
        User user = createUser(1L, "Customer");
        UserAuth auth = createEmailAuth(user, "user@example.com", "hashed-old");
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("wrong-pass");
        request.setNewPassword("new-pass");

        when(userAuthRepository.findByAuthTypeAndAuthValue("email", "user@example.com"))
                .thenReturn(Optional.of(auth));
        when(passwordEncoder.matches("wrong-pass", "hashed-old")).thenReturn(false);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> authService.changePassword("user@example.com", request, "Bearer jwt-token"));

        assertEquals(UNAUTHORIZED, exception.getStatusCode());
    }

    @Test
    void changePasswordRejectsOauthOnlyAccountWithoutPassword() {
        User user = createUser(1L, "Customer");
        UserAuth auth = createEmailAuth(user, "user@example.com", null);
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("old-pass");
        request.setNewPassword("new-pass");

        when(userAuthRepository.findByAuthTypeAndAuthValue("email", "user@example.com"))
                .thenReturn(Optional.of(auth));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> authService.changePassword("user@example.com", request, "Bearer jwt-token"));

        assertEquals(BAD_REQUEST, exception.getStatusCode());
    }

    private User createUser(Long id, String name) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", id);
        user.setName(name);
        user.setDeleted(false);
        return user;
    }

    private UserAuth createEmailAuth(User user, String email, String passwordHash) {
        UserAuth auth = new UserAuth();
        auth.setUser(user);
        auth.setAuthType("email");
        auth.setAuthValue(email);
        auth.setPasswordHash(passwordHash);
        return auth;
    }
}
