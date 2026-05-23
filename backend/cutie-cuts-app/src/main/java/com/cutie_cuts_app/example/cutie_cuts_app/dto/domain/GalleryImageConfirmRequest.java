package com.cutie_cuts_app.example.cutie_cuts_app.dto.domain;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class GalleryImageConfirmRequest {

    @NotBlank
    private String objectKey;

    @NotBlank
    private String contentType;

    @Positive
    private long fileSize;

    private String alt;
    private String category;

    public String getObjectKey() { return objectKey; }
    public void setObjectKey(String objectKey) { this.objectKey = objectKey; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public long getFileSize() { return fileSize; }
    public void setFileSize(long fileSize) { this.fileSize = fileSize; }
    public String getAlt() { return alt; }
    public void setAlt(String alt) { this.alt = alt; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}
