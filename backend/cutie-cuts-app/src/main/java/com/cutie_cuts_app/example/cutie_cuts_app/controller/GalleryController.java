package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.domain.GalleryImageConfirmRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.gallery.GalleryImageRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.gallery.GalleryImageResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.GalleryImage;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.GalleryImageRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.service.GalleryImageService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static org.springframework.http.HttpStatus.OK;

@RestController
@RequestMapping("/api/gallery")
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*", "http://[::1]:*"})
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

    @GetMapping("/page")
    public ResponseEntity<Page<GalleryImageResponse>> getAllPaginated(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<GalleryImage> images = galleryImageRepository.findAll(pageable);
        return ResponseEntity.ok(images.map(GalleryImageResponse::from));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GalleryImageResponse> getById(@PathVariable Long id) {
        GalleryImageResponse image = galleryImageService.findById(id);
        return ResponseEntity.ok(image);
    }

    @PostMapping("/confirm")
    public ResponseEntity<GalleryImageResponse> confirm(@Valid @RequestBody GalleryImageConfirmRequest request) {
        GalleryImageResponse response = galleryImageService.confirm(request);
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
