package com.cutie_cuts_app.example.cutie_cuts_app.dto.gallery;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.GalleryImage;

import java.time.LocalDateTime;

public class GalleryImageResponse {

    private final Long id;
    private final String url;
    private final String alt;
    private final String category;
    private final LocalDateTime uploadedAt;

    public GalleryImageResponse(Long id, String url, String alt, String category, LocalDateTime uploadedAt) {
        this.id = id;
        this.url = url;
        this.alt = alt;
        this.category = category;
        this.uploadedAt = uploadedAt;
    }

    public static GalleryImageResponse from(GalleryImage entity) {
        return new GalleryImageResponse(
                entity.getId(),
                entity.getUrl(),
                entity.getAlt(),
                entity.getCategory(),
                entity.getUploadedAt()
        );
    }

    public Long getId() { return id; }
    public String getUrl() { return url; }
    public String getAlt() { return alt; }
    public String getCategory() { return category; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }
}