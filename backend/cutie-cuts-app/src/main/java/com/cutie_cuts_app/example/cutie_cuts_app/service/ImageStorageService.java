package com.cutie_cuts_app.example.cutie_cuts_app.service;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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

    public UploadResult storeImage(String value) {
        if (value == null || value.isBlank()) {
            return new UploadResult("", false);
        }

        if (!isDataUrl(value)) {
            return new UploadResult(value, false);
        }

        ParsedImage parsed = parseDataUrl(value);
        try {
            String url = s3StorageService.uploadBarberImage(
                    parsed.bytes(),
                    parsed.contentType(),
                    parsed.extension()
            );
            return new UploadResult(url, true);
        } catch (Exception e) {
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