package com.cutie_cuts_app.example.cutie_cuts_app.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
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
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucketName).build());
        } catch (Exception e) {
            log.info("Bucket {} not found, attempting to create...", bucketName);
            try {
                s3Client.createBucket(CreateBucketRequest.builder().bucket(bucketName).build());
                log.info("Successfully created bucket: {}", bucketName);
            } catch (Exception ex) {
                log.warn("Failed to create bucket {}: {}", bucketName, ex.getMessage());
            }
        }
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

        // Return path-style URL using public endpoint
        return String.format("%s/%s/%s", publicUrl.replaceAll("/+$", ""), bucket, key);
    }

    public String uploadAvatar(MultipartFile file, Long userId) throws IOException {
        String path = "avatars/" + userId;
        return uploadFile(file, avatarsBucket, path);
    }

    public String uploadGalleryImage(MultipartFile file, String filename) throws IOException {
        String path = "images";
        return uploadFile(file, galleryBucket, path);
    }

    public void deleteFile(String url) {
        if (url == null || url.isBlank()) return;
        try {
            String bucket = url.contains("/avatars/") ? avatarsBucket : galleryBucket;
            String key = url.substring(url.indexOf(bucket) + bucket.length() + 1);
            // Strip leading slash if present (handles URLs without trailing slash on publicUrl)
            key = key.replaceFirst("^/+", "");

            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build());
        } catch (Exception e) {
            log.warn("Failed to delete file {}: {}", url, e.getMessage());
        }
    }
}