package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.gallery.GalleryImageRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.gallery.GalleryImageResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.GalleryImage;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.GalleryImageRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.service.GalleryImageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.OK;

@RestController
@RequestMapping("/gallery")
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:5173"})
public class GalleryController {

    private final GalleryImageService galleryImageService;
    private final GalleryImageRepository galleryImageRepository;

    public GalleryController(GalleryImageService galleryImageService,
                              GalleryImageRepository galleryImageRepository) {
        this.galleryImageService = galleryImageService;
        this.galleryImageRepository = galleryImageRepository;
    }

    @GetMapping
    public ResponseEntity<List<GalleryImageResponse>> getAll(
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        List<GalleryImageResponse> images = galleryImageService.findAll(category, page, size);
        return ResponseEntity.status(OK).body(images);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GalleryImageResponse> getById(@PathVariable Long id) {
        GalleryImageResponse image = galleryImageService.findById(id);
        return ResponseEntity.ok(image);
    }

    @PostMapping
    public ResponseEntity<GalleryImageResponse> create(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "alt", required = false) String alt,
            @RequestParam(value = "category", required = false) String category) {
        GalleryImageRequest request = new GalleryImageRequest();
        request.setAlt(alt);
        request.setCategory(category);
        GalleryImageResponse response = galleryImageService.upload(file, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GalleryImageResponse> update(
            @PathVariable Long id,
            @RequestParam(value = "alt", required = false) String alt,
            @RequestParam(value = "category", required = false) String category) {
        GalleryImageRequest request = new GalleryImageRequest();
        request.setAlt(alt);
        request.setCategory(category);
        GalleryImageResponse response = galleryImageService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        galleryImageService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
