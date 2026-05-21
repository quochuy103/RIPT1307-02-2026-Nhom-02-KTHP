package com.cutie_cuts_app.example.cutie_cuts_app.service;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class ImageStorageService {

    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final List<String> ALLOWED_MIME_TYPES = List.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );
    private static final Pattern DATA_URL_PATTERN = Pattern.compile(
            "^data:image/([a-zA-Z0-9+-]+);base64,(.+)$"
    );

    public enum ImageContext {
        BARBER, GALLERY, PRODUCT, AVATAR
    }

    private final S3StorageService s3StorageService;

    public ImageStorageService(S3StorageService s3StorageService) {
        this.s3StorageService = s3StorageService;
    }

    public record ParsedImage(byte[] bytes, String contentType, String extension) {}

    public record UploadResult(String url, boolean wasStored) {}

    public static boolean isDataUrl(String value) {
        if (value == null || value.isBlank()) return false;
        return DATA_URL_PATTERN.matcher(value).matches();
    }

    public static boolean isManagedUrl(String url) {
        if (url == null || url.isBlank()) return false;
        return !isDataUrl(url);
    }

    public ParsedImage parseDataUrl(String dataUrl) {
        Matcher matcher = DATA_URL_PATTERN.matcher(dataUrl);
        if (!matcher.matches()) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid data URL format");
        }

        String subtype = matcher.group(1).toLowerCase();
        String base64Data = matcher.group(2);

        String mimeType = mimeTypeFromSubtype(subtype);
        String extension = extensionFromMimeType(mimeType);

        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(base64Data);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid base64 encoding");
        }

        if (bytes.length > MAX_IMAGE_SIZE) {
            throw new ResponseStatusException(BAD_REQUEST, "Image size must not exceed 5MB");
        }

        if (!ALLOWED_MIME_TYPES.contains(mimeType)) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Unsupported image type. Allowed: JPEG, PNG, WebP");
        }

        return new ParsedImage(bytes, mimeType, extension);
    }

    /**
     * Delete a stored image from S3. Skips data URLs (not yet stored),
     * blank values, and external URLs not managed by MinIO.
     */
    public void deleteImage(String url) {
        if (url == null || url.isBlank()) return;
        if (isDataUrl(url)) return; // never persisted
        s3StorageService.deleteFile(url);
    }

    public UploadResult storeImage(String value) {
        return storeImage(value, ImageContext.BARBER);
    }

    public UploadResult storeImage(String value, ImageContext context) {
        if (value == null || value.isBlank()) {
            return new UploadResult("", false);
        }

        if (!isDataUrl(value)) {
            return new UploadResult(value, false);
        }

        ParsedImage parsed = parseDataUrl(value);
        try {
            String url = switch (context) {
                case BARBER -> s3StorageService.uploadBarberImage(parsed.bytes(), parsed.contentType(), parsed.extension());
                case GALLERY -> s3StorageService.uploadGalleryImage(parsed.bytes(), parsed.contentType(), parsed.extension());
                case PRODUCT -> s3StorageService.uploadProductImage(parsed.bytes(), parsed.contentType(), parsed.extension());
                case AVATAR -> s3StorageService.uploadAvatarImage(parsed.bytes(), parsed.contentType(), parsed.extension(), null);
            };
            return new UploadResult(url, true);
        } catch (IOException e) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                    "Failed to store image: " + e.getClass().getSimpleName());
        }
    }

    private String mimeTypeFromSubtype(String subtype) {
        return switch (subtype) {
            case "jpeg", "jpg" -> "image/jpeg";
            case "png" -> "image/png";
            case "webp" -> "image/webp";
            case "gif" -> "image/gif";
            default -> throw new ResponseStatusException(BAD_REQUEST,
                    "Unsupported image subtype: " + subtype + ". Allowed: jpeg, png, webp, gif");
        };
    }

    private String extensionFromMimeType(String mimeType) {
        return switch (mimeType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> throw new IllegalStateException("Unexpected mime type: " + mimeType);
        };
    }
}