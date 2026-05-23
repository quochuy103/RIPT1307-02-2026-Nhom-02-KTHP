package com.cutie_cuts_app.example.cutie_cuts_app.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.net.URI;
import java.util.UUID;

@Service
public class S3StorageService {

    private static final Logger log = LoggerFactory.getLogger(S3StorageService.class);

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

    private S3Client s3Client;

    @PostConstruct
    public void init() {
        log.info("Initializing S3 Client with endpoint: {}", endpoint);
        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);
        this.s3Client = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of("us-east-1"))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .forcePathStyle(true)
                .build();
    }

    private void ensureBucketExists(String bucketName) {
        boolean bucketExisted = true;
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucketName).build());
        } catch (Exception e) {
            log.info("Bucket {} not found, attempting to create...", bucketName);
            bucketExisted = false;
            try {
                s3Client.createBucket(CreateBucketRequest.builder().bucket(bucketName).build());
                log.info("Successfully created bucket: {}", bucketName);
            } catch (Exception ex) {
                log.warn("Failed to create bucket {}: {}", bucketName, ex.getMessage());
            }
        }
        // Always ensure public read policy is applied (covers new and pre-existing buckets)
        applyPublicReadPolicy(bucketName);
    }


    public String uploadFile(MultipartFile file, String bucket, String path) throws IOException {
        ensureBucketExists(bucket);
        String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
        String key = path + "/" + filename;

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(file.getContentType())
                .build();

        s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

        // MinIO path-style URL: {publicUrl}/{bucket}/{key}
        return String.format("%s/%s/%s", publicUrl.replaceAll("/+$", ""), bucket, key);
    }

    public String uploadAvatar(MultipartFile file, Long userId) throws IOException {
        // path = userId only, bucket = "avatars"
        // → key = "{userId}/{uuid}_{filename}"
        // → URL = http://localhost:9000/avatars/{userId}/{uuid}_{filename}
        String path = String.valueOf(userId);
        return uploadFile(file, avatarsBucket, path);

    public boolean objectExists(String bucket, String key) {
        try {
            s3Client.headObject(HeadObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build());
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (Exception e) {
            log.warn("headObject failed for bucket={} key={}: {}", bucket, key, e.getMessage());
            return false;
        }
    }

    public String derivePublicUrl(String bucket, String key) {
        return String.format("%s/%s/%s", publicUrl.replaceAll("/+$", ""), bucket, key);

    }

    public String getAvatarsBucket() { return avatarsBucket; }
    public String getGalleryBucket() { return galleryBucket; }
    public String getBarbersBucket() { return barbersBucket; }

    public String uploadBarberImage(byte[] imageBytes, String contentType, String extension) throws IOException {
        return uploadBytesToBucket(imageBytes, contentType, extension, barbersBucket);
    }

    public String uploadGalleryImage(byte[] imageBytes, String contentType, String extension) throws IOException {
        return uploadBytesToBucket(imageBytes, contentType, extension, galleryBucket);
    }

    public String uploadProductImage(byte[] imageBytes, String contentType, String extension) throws IOException {
        return uploadBytesToBucket(imageBytes, contentType, extension, galleryBucket);
    }

    public String uploadAvatarImage(byte[] imageBytes, String contentType, String extension, Long userId) throws IOException {
        ensureBucketExists(avatarsBucket);
        String key = "avatars/" + userId + "/" + UUID.randomUUID() + extension;

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(avatarsBucket)
                .key(key)
                .contentType(contentType)
                .acl("public-read")
                .build();

        s3Client.putObject(request, RequestBody.fromBytes(imageBytes));

        return String.format("%s/%s", publicUrl.replaceAll("/+$", ""), key);
    }

    private String uploadBytesToBucket(byte[] imageBytes, String contentType, String extension, String bucket) throws IOException {
        ensureBucketExists(bucket);
        String key = UUID.randomUUID() + extension;

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .acl("public-read")
                .build();

        s3Client.putObject(request, RequestBody.fromBytes(imageBytes));

        return String.format("%s/%s/%s", publicUrl.replaceAll("/+$", ""), bucket, key);
    }

    private void applyPublicReadPolicy(String bucketName) {
        try {
            String policy = """
            {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Sid": "PublicReadGetObject",
                  "Effect": "Allow",
                  "Principal": {"AWS": ["*"]},
                  "Action": ["s3:GetObject"],
                  "Resource": ["arn:aws:s3:::%s/*"]
                }
              ]
            }
            """.formatted(bucketName);

            s3Client.putBucketPolicy(PutBucketPolicyRequest.builder()
                    .bucket(bucketName)
                    .policy(policy)
                    .build());
            log.info("Applied public read policy to bucket: {}", bucketName);
        } catch (Exception e) {
            log.warn("Failed to apply public read policy to bucket {}: {}", bucketName, e.getMessage());
        }
    }

    public void deleteFile(String url) {
        if (url == null || url.isBlank()) return;
        try {
            // Strip publicUrl prefix to get the object path
            String path = url;
            String normalizedPublicUrl = publicUrl.replaceAll("/+$", "");
            if (url.startsWith(normalizedPublicUrl)) {
                path = url.substring(normalizedPublicUrl.length());
            } else if (url.startsWith("http://") || url.startsWith("https://")) {
                // External URL — not managed by MinIO, skip
                log.debug("External URL, skipping deletion: {}", url);
                return;
            }
            path = path.replaceFirst("^/+", "");

            String bucket;
            String key;

            if (path.startsWith(barbersBucket + "/")) {
                bucket = barbersBucket;
                key = path.substring(barbersBucket.length() + 1);
            } else if (path.startsWith(avatarsBucket + "/")) {
                bucket = avatarsBucket;
                key = path.substring(avatarsBucket.length() + 1);
            } else if (path.startsWith("images/")) {
                bucket = galleryBucket;
                key = path.substring("images/".length());
            } else if (path.startsWith("products/")) {
                // Product images stored in barbers bucket under products/ prefix
                bucket = barbersBucket;
                key = path.substring("products/".length());
            } else if (path.startsWith(galleryBucket + "/")) {
                bucket = galleryBucket;
                key = path.substring(galleryBucket.length() + 1);
            } else if (path.startsWith(barbersBucket + "/")) {
                bucket = barbersBucket;
                key = path.substring(barbersBucket.length() + 1);
            } else if (!path.contains("/") && !path.startsWith("http")) {
                // Bare object key (e.g., "uuid.jpg") — assume barbers bucket
                bucket = barbersBucket;
                key = path;
            } else if (path.startsWith("avatars/")) {
                bucket = avatarsBucket;
                key = path.substring("avatars/".length());
            } else {
                // Not a managed MinIO URL or object key — skip
                log.debug("Value does not match any managed bucket, skipping deletion: {}", url);
                return;
            }

            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build());
            log.info("Deleted file from bucket {}: {}", bucket, key);
        } catch (Exception e) {
            log.warn("Failed to delete file {}: {}", url, e.getMessage());
        }
    }
}