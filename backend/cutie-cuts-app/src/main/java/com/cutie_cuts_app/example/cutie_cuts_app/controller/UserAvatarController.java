package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.domain.AvatarConfirmRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.service.CurrentUserService;
import com.cutie_cuts_app.example.cutie_cuts_app.service.PresignService;
import com.cutie_cuts_app.example.cutie_cuts_app.service.S3StorageService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequestMapping("/api/users/me/avatar")
public class UserAvatarController {

    private final UserRepository userRepository;
    private final S3StorageService s3StorageService;
    private final CurrentUserService currentUserService;
    private final PresignService presignService;

    public UserAvatarController(UserRepository userRepository, S3StorageService s3StorageService,
            CurrentUserService currentUserService, PresignService presignService) {
        this.userRepository = userRepository;
        this.s3StorageService = s3StorageService;
        this.currentUserService = currentUserService;
        this.presignService = presignService;
    }

    @PostMapping("/confirm")
    public Map<String, Object> confirmAvatar(@Valid @RequestBody AvatarConfirmRequest request,
                                              Authentication auth) {
        if (!PresignService.ALLOWED_CONTENT_TYPES.contains(request.getContentType())) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Unsupported content type. Allowed: image/jpeg, image/png, image/webp, image/gif");
        }

        if (request.getFileSize() <= 0 || request.getFileSize() > PresignService.MAX_IMAGE_SIZE) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "File size must be between 1 byte and 5 MB");
        }

        User user = currentUserService.getByEmail(auth.getName());

        String expectedPrefix = "avatars/" + user.getId() + "/";
        String objectKey = request.getObjectKey();
        if (!objectKey.startsWith(expectedPrefix) || objectKey.contains("..")) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "objectKey does not belong to the current user");
        }

        String bucket = presignService.bucketForContext("AVATAR");
        if (!s3StorageService.objectExists(bucket, objectKey)) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Object not found in storage. Upload may not have completed.");
        }

        String avatarUrl = s3StorageService.derivePublicUrl(bucket, objectKey);
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("url", avatarUrl);
        response.put("objectKey", objectKey);
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
