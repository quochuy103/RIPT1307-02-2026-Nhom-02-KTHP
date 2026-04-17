package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.GalleryImage;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.GalleryImageRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/gallery")
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:5173"})
public class GalleryController {

    private final GalleryImageRepository galleryImageRepository;

    public GalleryController(GalleryImageRepository galleryImageRepository) {
        this.galleryImageRepository = galleryImageRepository;
    }

    @GetMapping
    public List<GalleryImage> getAll() {
        return galleryImageRepository.findAll();
    }

    @PostMapping
    public GalleryImage create(@RequestBody GalleryImage body) {
        return galleryImageRepository.save(body);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        if (!galleryImageRepository.existsById(id)) {
            throw new ResponseStatusException(NOT_FOUND, "Image not found");
        }
        galleryImageRepository.deleteById(id);
    }
}
