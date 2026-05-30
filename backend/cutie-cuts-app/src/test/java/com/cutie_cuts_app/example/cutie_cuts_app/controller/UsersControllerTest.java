package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.UserAuth;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsersControllerTest {

    @Mock
    private UserRepository userRepository;

    private UsersController usersController;

    @BeforeEach
    void setUp() {
        usersController = new UsersController(userRepository);
    }

    @Test
    void getAllUsesStableNewestFirstSort() {
        User newerUser = createUser(2L, "New User", "new@example.com", LocalDateTime.of(2026, 5, 16, 10, 0));
        User olderUser = createUser(1L, "Old User", "old@example.com", LocalDateTime.of(2026, 5, 15, 10, 0));

        when(userRepository.findAll(org.mockito.ArgumentMatchers.<Sort>any()))
                .thenReturn(List.of(newerUser, olderUser));

        List<Map<String, Object>> response = usersController.getAll();

        verify(userRepository).findAll(org.mockito.ArgumentMatchers.<Sort>argThat(sort ->
                sort.equals(Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")))));
        assertEquals(2L, response.get(0).get("id"));
        assertEquals(1L, response.get(1).get("id"));
        assertEquals("new@example.com", response.get(0).get("email"));
    }

    private User createUser(Long id, String name, String email, LocalDateTime createdAt) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", id);
        user.setName(name);
        user.setPhone("0900000000");
        user.setRole("USER");
        user.setCreatedAt(createdAt);
        user.setDeleted(false);

        UserAuth auth = new UserAuth();
        auth.setAuthType("email");
        auth.setAuthValue(email);
        auth.setUser(user);
        user.setAuthMethods(List.of(auth));
        return user;
    }
}
