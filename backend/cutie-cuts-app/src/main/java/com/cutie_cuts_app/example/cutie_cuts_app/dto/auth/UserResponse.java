package com.cutie_cuts_app.example.cutie_cuts_app.dto.auth;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;

public class UserResponse {

    private final Long id;
    private final String name;
    private final String email;
    private final String role;

    public UserResponse(Long id, String name, String email, String role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
    }

    public static UserResponse from(User user, String email) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                email,
                user.getRole() == null ? "user" : user.getRole().toLowerCase()
        );
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }
}
