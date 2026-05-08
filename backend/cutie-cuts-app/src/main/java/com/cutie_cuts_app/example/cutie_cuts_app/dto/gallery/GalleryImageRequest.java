package com.cutie_cuts_app.example.cutie_cuts_app.dto.gallery;

import org.springframework.web.multipart.MultipartFile;

public class GalleryImageRequest {

    private String alt;
    private String category;
    private MultipartFile file;

    public String getAlt() { return alt; }
    public void setAlt(String alt) { this.alt = alt; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public MultipartFile getFile() { return file; }
    public void setFile(MultipartFile file) { this.file = file; }
}