package com.cutie_cuts_app.example.cutie_cuts_app.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("PresignService")
class PresignServiceTest {

    private PresignService presignService;

    @BeforeEach
    void setUp() {
        presignService = new PresignService();
        ReflectionTestUtils.setField(presignService, "endpoint", "http://localhost:9000");
        ReflectionTestUtils.setField(presignService, "publicUrl", "http://localhost:9000");
        ReflectionTestUtils.setField(presignService, "accessKey", "minioadmin");
        ReflectionTestUtils.setField(presignService, "secretKey", "minioadmin");
        ReflectionTestUtils.setField(presignService, "avatarsBucket", "avatars");
        ReflectionTestUtils.setField(presignService, "galleryBucket", "gallery");
        ReflectionTestUtils.setField(presignService, "barbersBucket", "barbers");
    }

    @Test
    @DisplayName("generateUploadUrl rejects unsupported content type")
    void generateUploadUrl_unsupportedContentType_throws() {
        var ex = assertThrows(ResponseStatusException.class,
                () -> presignService.generateUploadUrl("AVATAR", "image/bmp", 1024));
        assertTrue(ex.getMessage().contains("Unsupported content type"));
    }

    @Test
    @DisplayName("generateUploadUrl rejects oversized file")
    void generateUploadUrl_oversizedFile_throws() {
        var ex = assertThrows(ResponseStatusException.class,
                () -> presignService.generateUploadUrl("AVATAR", "image/jpeg", 10 * 1024 * 1024));
        assertTrue(ex.getMessage().contains("File size"));
    }

    @Test
    @DisplayName("generateUploadUrl rejects file size <= 0")
    void generateUploadUrl_zeroSize_throws() {
        var ex = assertThrows(ResponseStatusException.class,
                () -> presignService.generateUploadUrl("AVATAR", "image/png", 0));
        assertTrue(ex.getMessage().contains("File size"));
    }

    @Test
    @DisplayName("generateUploadUrl rejects invalid context")
    void generateUploadUrl_invalidContext_throws() {
        var ex = assertThrows(ResponseStatusException.class,
                () -> presignService.generateUploadUrl("INVALID", "image/jpeg", 1024));
        assertTrue(ex.getMessage().contains("Invalid context"));
    }

    @Test
    @DisplayName("isAdminContext returns true for GALLERY")
    void isAdminContext_gallery_returnsTrue() {
        assertTrue(presignService.isAdminContext("GALLERY"));
    }

    @Test
    @DisplayName("isAdminContext returns false for AVATAR")
    void isAdminContext_avatar_returnsFalse() {
        assertFalse(presignService.isAdminContext("AVATAR"));
    }

    @Test
    @DisplayName("isValidObjectKey accepts valid AVATAR key")
    void isValidObjectKey_validAvatar_returnsTrue() {
        assertTrue(presignService.isValidObjectKey("AVATAR", "avatars/42/uuid.jpg"));
    }

    @Test
    @DisplayName("isValidObjectKey rejects AVATAR key outside prefix")
    void isValidObjectKey_avatarOutsidePrefix_returnsFalse() {
        assertFalse(presignService.isValidObjectKey("AVATAR", "images/uuid.jpg"));
    }

    @Test
    @DisplayName("isValidObjectKey rejects path traversal")
    void isValidObjectKey_pathTraversal_returnsFalse() {
        assertFalse(presignService.isValidObjectKey("AVATAR", "avatars/../../etc/passwd"));
    }

    @Test
    @DisplayName("isValidObjectKey rejects external URL")
    void isValidObjectKey_externalUrl_returnsFalse() {
        assertFalse(presignService.isValidObjectKey("AVATAR", "http://evil.com/malware.jpg"));
    }

    @Test
    @DisplayName("isValidObjectKey accepts valid GALLERY key")
    void isValidObjectKey_validGallery_returnsTrue() {
        assertTrue(presignService.isValidObjectKey("GALLERY", "images/uuid.jpg"));
    }

    @Test
    @DisplayName("isValidObjectKey rejects GALLERY key without prefix")
    void isValidObjectKey_galleryWithoutPrefix_returnsFalse() {
        assertFalse(presignService.isValidObjectKey("GALLERY", "uuid.jpg"));
    }

    @Test
    @DisplayName("validateObjectKeyForContext throws for invalid key")
    void validateObjectKeyForContext_invalid_throws() {
        var ex = assertThrows(ResponseStatusException.class,
                () -> presignService.validateObjectKeyForContext("AVATAR", "bad-key"));
        assertTrue(ex.getMessage().contains("objectKey"));
    }

    @Test
    @DisplayName("validateObjectKeyForContext succeeds for valid key")
    void validateObjectKeyForContext_valid_doesNotThrow() {
        assertDoesNotThrow(() -> presignService.validateObjectKeyForContext("AVATAR", "avatars/1/uuid.png"));
    }
}
