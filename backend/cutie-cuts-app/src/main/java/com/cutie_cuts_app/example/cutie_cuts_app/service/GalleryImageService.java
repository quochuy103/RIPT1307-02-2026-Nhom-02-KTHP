package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.domain.GalleryImageConfirmRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.gallery.GalleryImageRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.gallery.GalleryImageResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.GalleryImage;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.GalleryImageRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class GalleryImageService {

    private final GalleryImageRepository galleryImageRepository;
    private final S3StorageService s3StorageService;
    private final ImageStorageService imageStorageService;
    private final PresignService presignService;

    @Value("${s3.bucket-gallery:gallery}")
    private String galleryBucket;

    public GalleryImageService(GalleryImageRepository galleryImageRepository, S3StorageService s3StorageService,
            ImageStorageService imageStorageService, PresignService presignService) {
        this.galleryImageRepository = galleryImageRepository;
        this.s3StorageService = s3StorageService;
        this.imageStorageService = imageStorageService;
        this.presignService = presignService;
    }

    @Transactional(readOnly = true)
    public List<GalleryImageResponse> findAll(String category, int page, int size) {
        List<GalleryImage> images;
        if (category != null && !category.isBlank()) {
            images = galleryImageRepository.findByCategoryAndDeletedFalse(category);
        } else {
            Pageable pageable = PageRequest.of(page, size);
            images = galleryImageRepository.findByDeletedFalseOrderByUploadedAtDesc(pageable);
        }
        return images.stream()
                .map(GalleryImageResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public GalleryImageResponse findById(Long id) {
        GalleryImage image = galleryImageRepository.findById(id)
                .filter(img -> !Boolean.TRUE.equals(img.getDeleted()))
                .orElseThrow(() -> new ImageNotFoundException(id));
        return GalleryImageResponse.from(image);
    }

    @Transactional
    public GalleryImageResponse confirm(GalleryImageConfirmRequest request) {
        if (!PresignService.ALLOWED_CONTENT_TYPES.contains(request.getContentType())) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Unsupported content type. Allowed: image/jpeg, image/png, image/webp, image/gif");
        }

        if (request.getFileSize() <= 0 || request.getFileSize() > PresignService.MAX_IMAGE_SIZE) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "File size must be between 1 byte and 5 MB");
        }

        String objectKey = request.getObjectKey();
        if (!presignService.isValidObjectKey("GALLERY", objectKey)) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "objectKey does not match expected prefix for GALLERY context");
        }

        String bucket = presignService.bucketForContext("GALLERY");
        if (!s3StorageService.objectExists(bucket, objectKey)) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Object not found in storage. Upload may not have completed.");
        }

        String url = s3StorageService.derivePublicUrl(bucket, objectKey);

        GalleryImage image = new GalleryImage();
        image.setUrl(url);
        image.setAlt(request.getAlt() != null ? request.getAlt() : "");
        image.setCategory(request.getCategory() != null ? request.getCategory() : "general");

        GalleryImage saved = galleryImageRepository.save(image);
        return GalleryImageResponse.from(saved);
    }

    @Transactional
    public GalleryImageResponse update(Long id, GalleryImageRequest request) {
        GalleryImage image = galleryImageRepository.findById(id)
                .filter(img -> !Boolean.TRUE.equals(img.getDeleted()))
                .orElseThrow(() -> new ImageNotFoundException(id));

        if (request.getAlt() != null) {
            image.setAlt(request.getAlt());
        }
        if (request.getCategory() != null) {
            image.setCategory(request.getCategory());
        }

        GalleryImage saved = galleryImageRepository.save(image);
        return GalleryImageResponse.from(saved);
    }

    @Transactional
    public void delete(Long id) {
        GalleryImage image = galleryImageRepository.findById(id)
                .filter(img -> !Boolean.TRUE.equals(img.getDeleted()))
                .orElseThrow(() -> new ImageNotFoundException(id));
        imageStorageService.deleteImage(image.getUrl());
        image.setDeleted(true);
        image.setDeletedAt(java.time.LocalDateTime.now());
        galleryImageRepository.save(image);
    }

    public static class ImageNotFoundException extends ResponseStatusException {
        public ImageNotFoundException(Long id) {
            super(HttpStatus.NOT_FOUND, "Gallery image not found: id=" + id);
        }
    }
}
