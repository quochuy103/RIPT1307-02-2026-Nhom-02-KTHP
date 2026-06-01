package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.domain.PresignRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.service.CurrentUserService;
import com.cutie_cuts_app.example.cutie_cuts_app.service.PresignService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/api/uploads")
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:5173"})
public class PresignController {

    private final PresignService presignService;
    private final CurrentUserService currentUserService;

    public PresignController(PresignService presignService, CurrentUserService currentUserService) {
        this.presignService = presignService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/presign")
    public Map<String, Object> presign(@Valid @RequestBody PresignRequest request,
                                        Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (presignService.isAdminContext(request.getContext()) && !isAdmin) {
            throw new ResponseStatusException(FORBIDDEN,
                    "Only admins can upload images for context: " + request.getContext());
        }

        Long userId = null;
        if ("AVATAR".equalsIgnoreCase(request.getContext())) {
            User currentUser = currentUserService.getByEmail(authentication.getName());
            userId = currentUser.getId();
        }

        PresignService.PresignResult result = presignService.generateUploadUrl(
                request.getContext(),
                request.getContentType(),
                request.getSizeBytes(),
                userId);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("uploadUrl", result.uploadUrl());
        response.put("objectKey", result.objectKey());
        response.put("publicUrl", result.publicUrl());
        response.put("expiresInSeconds", result.expiresInSeconds());
        response.put("headers", result.headers());
        return response;
    }
}
