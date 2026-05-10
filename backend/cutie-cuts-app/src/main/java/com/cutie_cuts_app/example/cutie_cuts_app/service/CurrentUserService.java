package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.UserAuth;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserAuthRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class CurrentUserService {

    private final UserAuthRepository userAuthRepository;

    public CurrentUserService(UserAuthRepository userAuthRepository) {
        this.userAuthRepository = userAuthRepository;
    }

    public User getByEmail(String email) {
        UserAuth auth = userAuthRepository
                .findByAuthTypeAndAuthValue("email", email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "User not found"));

        if (Boolean.TRUE.equals(auth.getUser().getDeleted())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Account has been deactivated");
        }

        return auth.getUser();
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(UNAUTHORIZED, "User not authenticated");
        }

        String email = authentication.getName();
        return getByEmail(email);
    }
}
