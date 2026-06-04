package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.domain.PresignRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.service.CurrentUserService;
import com.cutie_cuts_app.example.cutie_cuts_app.service.PresignService;
import com.cutie_cuts_app.example.cutie_cuts_app.service.S3StorageService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.springframework.http.HttpStatus.*;

@RestController
@RequestMapping("/api/uploads")
public class PresignController {

    private static final Logger log = LoggerFactory.getLogger(PresignController.class);

    private final PresignService presignService;
    private final CurrentUserService currentUserService;
    private final S3StorageService s3StorageService;

    public PresignController(PresignService presignService, CurrentUserService currentUserService,
                             S3StorageService s3StorageService) {
        this.presignService = presignService;
        this.currentUserService = currentUserService;
        this.s3StorageService = s3StorageService;
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

    @PostMapping("/image")
    public Map<String, Object> uploadImage(@RequestParam("file") MultipartFile file,
                                           @RequestParam("context") String context,
                                           Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }

        String normalizedContext = context.toUpperCase();
        if (!PresignService.ALL_CONTEXTS.contains(normalizedContext)) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Invalid context. Allowed: " + String.join(", ", PresignService.ALL_CONTEXTS));
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (presignService.isAdminContext(normalizedContext) && !isAdmin) {
            throw new ResponseStatusException(FORBIDDEN,
                    "Only admins can upload images for context: " + normalizedContext);
        }

        Long userId = null;
        if ("AVATAR".equals(normalizedContext)) {
            User currentUser = currentUserService.getByEmail(authentication.getName());
            userId = currentUser.getId();
        }

        try {
            S3StorageService.MultipartUploadResult result = s3StorageService.uploadMultipartImage(file, normalizedContext, userId);

            String imageUrl = "/api/uploads/images/" + result.bucket() + "/" + result.objectKey();

            log.info("Uploaded image context={} key={} size={}", normalizedContext, result.objectKey(), result.sizeBytes());

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("imageUrl", imageUrl);
            response.put("objectKey", result.objectKey());
            response.put("bucket", result.bucket());
            response.put("contentType", result.contentType());
            response.put("sizeBytes", result.sizeBytes());
            return response;
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(BAD_REQUEST, e.getMessage());
        } catch (IOException e) {
            throw new ResponseStatusException(SERVICE_UNAVAILABLE, "Failed to upload image");
        }
    }

    @GetMapping("/images/**")
    public ResponseEntity<InputStreamResource> serveImage(HttpServletRequest request) {
        String fullPath = request.getRequestURI();
        String path = fullPath.substring(fullPath.indexOf("/images/") + "/images/".length());

        if (path.isBlank()) {
            throw new ResponseStatusException(NOT_FOUND, "Image not found");
        }

        // Parse bucket (first segment) and objectKey (remaining path)
        int slashIdx = path.indexOf('/');
        if (slashIdx < 0) {
            throw new ResponseStatusException(NOT_FOUND, "Image not found");
        }
        String bucket = path.substring(0, slashIdx);
        String objectKey = path.substring(slashIdx + 1);

        try {
            ResponseInputStream<GetObjectResponse> objectStream = s3StorageService.getObjectStream(bucket, objectKey);
            String contentType = objectStream.response().contentType();
            long contentLength = objectStream.response().contentLength();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"));
            headers.setContentLength(contentLength);
            headers.setCacheControl("public, max-age=86400");

            return ResponseEntity.ok().headers(headers).body(new InputStreamResource(objectStream));
        } catch (NoSuchKeyException e) {
            throw new ResponseStatusException(NOT_FOUND, "Image not found");
        }
    }

    /** Legacy proxy for existing MinIO images stored with old /minio/ path prefix */
    @GetMapping("/minio-legacy/**")
    public ResponseEntity<InputStreamResource> serveLegacyImage(HttpServletRequest request) {
        String path = request.getRequestURI();
        String legacyPath = path.substring(path.indexOf("/minio-legacy/") + "/minio-legacy/".length());

        if (legacyPath.isBlank()) {
            throw new ResponseStatusException(NOT_FOUND, "Image not found");
        }

        String bucket;
        String key;
        if (legacyPath.startsWith("images/")) {
            bucket = s3StorageService.getGalleryBucket();
            key = legacyPath;
        } else if (legacyPath.startsWith("products/")) {
            bucket = s3StorageService.getBarbersBucket();
            key = legacyPath;
        } else if (legacyPath.startsWith("avatars/")) {
            bucket = s3StorageService.getAvatarsBucket();
            key = legacyPath.substring("avatars/".length());
        } else if (legacyPath.startsWith(s3StorageService.getBarbersBucket() + "/")) {
            bucket = s3StorageService.getBarbersBucket();
            key = legacyPath.substring(s3StorageService.getBarbersBucket().length() + 1);
        } else {
            bucket = s3StorageService.getBarbersBucket();
            key = legacyPath;
        }

        try {
            ResponseInputStream<GetObjectResponse> objectStream = s3StorageService.getObjectStream(bucket, key);
            String contentType = objectStream.response().contentType();
            long contentLength = objectStream.response().contentLength();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"));
            headers.setContentLength(contentLength);
            headers.setCacheControl("public, max-age=86400");

            return ResponseEntity.ok().headers(headers).body(new InputStreamResource(objectStream));
        } catch (NoSuchKeyException e) {
            throw new ResponseStatusException(NOT_FOUND, "Image not found");
        }
    }
}
