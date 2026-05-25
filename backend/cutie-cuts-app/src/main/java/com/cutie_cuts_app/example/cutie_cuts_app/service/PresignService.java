package com.cutie_cuts_app.example.cutie_cuts_app.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class PresignService {

    private static final Logger log = LoggerFactory.getLogger(PresignService.class);

    public static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    public static final Duration PRESIGN_EXPIRY = Duration.ofMinutes(5);
    public static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif");
    public static final Set<String> ADMIN_CONTEXTS = Set.of("BARBER", "GALLERY", "PRODUCT");
    public static final Set<String> ALL_CONTEXTS = Set.of("BARBER", "GALLERY", "PRODUCT", "AVATAR");

    private final S3Presigner presigner;

    @Value("${s3.endpoint}")
    private String endpoint;

    @Value("${s3.public-url}")
    private String publicUrl;

    @Value("${s3.access-key}")
    private String accessKey;

    @Value("${s3.secret-key}")
    private String secretKey;

    @Value("${s3.bucket-avatars:avatars}")
    private String avatarsBucket;

    @Value("${s3.bucket-gallery:gallery}")
    private String galleryBucket;

    @Value("${s3.bucket-barbers:barbers}")
    private String barbersBucket;

    private final S3StorageService s3StorageService;

    public PresignService(S3StorageService s3StorageService) {
        this.s3StorageService = s3StorageService;
        this.presigner = null;
    }

    private S3Presigner getPresigner() {
        if (presigner != null) return presigner;
        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);
        return S3Presigner.builder()
                .endpointOverride(URI.create(publicUrl))
                .region(Region.of("us-east-1"))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .build();
    }

    public PresignResult generateUploadUrl(String context, String contentType, long sizeBytes) {
        if (!ALL_CONTEXTS.contains(context.toUpperCase())) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Invalid context. Allowed: " + String.join(", ", ALL_CONTEXTS));
        }

        String normalizedContext = context.toUpperCase();

        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Unsupported content type. Allowed: image/jpeg, image/png, image/webp, image/gif");
        }

        if (sizeBytes <= 0 || sizeBytes > MAX_IMAGE_SIZE) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "File size must be between 1 byte and 5 MB");
        }

        String extension = extensionFromContentType(contentType);
        String objectKey = generateObjectKey(normalizedContext, extension);
        String bucket = bucketForContext(normalizedContext);

        s3StorageService.ensureBucketExists(bucket);

        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(objectKey)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(PRESIGN_EXPIRY)
                .putObjectRequest(objectRequest)
                .build();

        S3Presigner p = getPresigner();
        PresignedPutObjectRequest presigned = p.presignPutObject(presignRequest);

        String fullPublicUrl = String.format("%s/%s/%s",
                publicUrl.replaceAll("/+$", ""), bucket, objectKey);

        log.info("Generated presigned upload URL for context={} key={}", normalizedContext, objectKey);

        return new PresignResult(
                presigned.url().toString(),
                objectKey,
                fullPublicUrl,
                PRESIGN_EXPIRY.toSeconds(),
                Map.of("Content-Type", contentType));
    }

    public boolean isAdminContext(String context) {
        return ADMIN_CONTEXTS.contains(context.toUpperCase());
    }

    public static String extensionFromContentType(String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> throw new ResponseStatusException(BAD_REQUEST, "Unsupported content type: " + contentType);
        };
    }

    public String derivePublicUrl(String context, String objectKey) {
        String bucket = bucketForContext(context.toUpperCase());
        return String.format("%s/%s/%s", publicUrl.replaceAll("/+$", ""), bucket, objectKey);
    }

    public boolean isValidObjectKey(String context, String objectKey) {
        if (objectKey == null || objectKey.isBlank()) return false;
        if (objectKey.contains("..") || objectKey.startsWith("/") || objectKey.startsWith("http"))
            return false;

        return switch (context.toUpperCase()) {
            case "AVATAR" -> objectKey.startsWith("avatars/") && objectKey.split("/").length >= 3;
            case "GALLERY" -> objectKey.startsWith("images/");
            case "BARBER" -> !objectKey.contains("/");
            case "PRODUCT" -> objectKey.startsWith("products/");
            default -> false;
        };
    }

    public void validateObjectKeyForContext(String context, String objectKey) {
        if (!isValidObjectKey(context, objectKey)) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "objectKey does not match expected prefix for context: " + context);
        }
    }

    public String bucketForContext(String context) {
        return switch (context.toUpperCase()) {
            case "BARBER" -> barbersBucket;
            case "GALLERY" -> galleryBucket;
            case "AVATAR" -> avatarsBucket;
            case "PRODUCT" -> barbersBucket;
            default -> throw new ResponseStatusException(BAD_REQUEST, "Unknown context: " + context);
        };
    }

    private String generateObjectKey(String context, String extension) {
        String uuid = UUID.randomUUID().toString();
        return switch (context) {
            case "BARBER" -> uuid + extension;
            case "GALLERY" -> "images/" + uuid + extension;
            case "PRODUCT" -> "products/" + uuid + extension;
            case "AVATAR" -> "avatars/" + uuid + extension;
            default -> throw new ResponseStatusException(BAD_REQUEST, "Unknown context: " + context);
        };
    }

    public record PresignResult(String uploadUrl, String objectKey, String publicUrl,
                                 long expiresInSeconds, Map<String, String> headers) {}
}
