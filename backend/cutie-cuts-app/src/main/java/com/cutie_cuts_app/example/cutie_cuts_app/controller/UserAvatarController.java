package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.service.CurrentUserService;
import com.cutie_cuts_app.example.cutie_cuts_app.service.S3StorageService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequestMapping("/api/users/me/avatar")
public class UserAvatarController {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp"
    );

    private final UserRepository userRepository;
    private final S3StorageService s3StorageService;
    private final CurrentUserService currentUserService;

    public UserAvatarController(UserRepository userRepository, S3StorageService s3StorageService,
            CurrentUserService currentUserService) {
        this.userRepository = userRepository;
        this.s3StorageService = s3StorageService;
        this.currentUserService = currentUserService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> uploadAvatar(@RequestParam("file") MultipartFile file, Authentication auth) {
        // Validate: image only, max 5MB
        if (file.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "File is required");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(BAD_REQUEST, "File size must not exceed 5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new ResponseStatusException(BAD_REQUEST, "Only image files (JPEG, PNG, GIF, WebP) are allowed");
        }

        // Get current user
        User user = currentUserService.getByEmail(auth.getName());

        // Upload to S3
        String avatarUrl;
        try {
            avatarUrl = s3StorageService.uploadAvatar(file, user.getId());
        } catch (IOException e) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, "Failed to upload avatar: " + e.getMessage());
        }

        // Update User.avatarUrl
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);

        // Return { url: "..." }
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("url", avatarUrl);
        return response;
    }

    @GetMapping
    public Map<String, Object> getAvatar(Authentication auth) {
        User user = currentUserService.getByEmail(auth.getName());
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("url", user.getAvatarUrl());
        return response;
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAvatar(Authentication auth) {
        User user = currentUserService.getByEmail(auth.getName());
        String avatarUrl = user.getAvatarUrl();

        if (avatarUrl != null) {
            s3StorageService.deleteFile(avatarUrl);
            user.setAvatarUrl(null);
            userRepository.save(user);
        }

        return ResponseEntity.noContent().build();
    }
}