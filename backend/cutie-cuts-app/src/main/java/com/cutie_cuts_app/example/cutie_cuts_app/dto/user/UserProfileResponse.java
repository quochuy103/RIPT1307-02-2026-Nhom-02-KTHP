package com.cutie_cuts_app.example.cutie_cuts_app.dto.user;

import java.time.LocalDateTime;

public class UserProfileResponse {

    private final Long id;
    private final String name;
    private final String fullName;
    private final String gender;
    private final String phone;
    private final String email;
    private final String address;
    private final String avatarUrl;
    private final String role;
    private final LocalDateTime createdAt;

    public UserProfileResponse(
            Long id,
            String name,
            String gender,
            String phone,
            String email,
            String address,
            String avatarUrl,
            String role,
            LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.fullName = name;
        this.gender = gender;
        this.phone = phone;
        this.email = email;
        this.address = address;
        this.avatarUrl = avatarUrl;
        this.role = role;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getFullName() {
        return fullName;
    }

    public String getGender() {
        return gender;
    }

    public String getPhone() {
        return phone;
    }

    public String getEmail() {
        return email;
    }

    public String getAddress() {
        return address;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public String getRole() {
        return role;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
