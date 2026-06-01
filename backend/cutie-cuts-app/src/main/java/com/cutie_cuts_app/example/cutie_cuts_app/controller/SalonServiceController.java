package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.service.SalonServiceRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.service.SalonServiceResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.service.SalonServiceService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequestMapping("/api/services")
public class SalonServiceController {

    private final SalonServiceService salonServiceService;

    public SalonServiceController(SalonServiceService salonServiceService) {
        this.salonServiceService = salonServiceService;
    }

    @GetMapping
    public ResponseEntity<List<SalonServiceResponse>> getAll() {
        return ResponseEntity.ok(salonServiceService.findAll());
    }

    @GetMapping("/page")
    public ResponseEntity<Page<SalonServiceResponse>> getAllPaginated(
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer minPrice,
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(required = false) Integer minDuration,
            @RequestParam(required = false) Integer maxDuration) {

        if (minPrice != null && minPrice < 0) {
            throw new ResponseStatusException(BAD_REQUEST, "minPrice must be >= 0");
        }
        if (maxPrice != null && maxPrice < 0) {
            throw new ResponseStatusException(BAD_REQUEST, "maxPrice must be >= 0");
        }
        if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
            throw new ResponseStatusException(BAD_REQUEST, "minPrice must be <= maxPrice");
        }
        if (minDuration != null && minDuration < 0) {
            throw new ResponseStatusException(BAD_REQUEST, "minDuration must be >= 0");
        }
        if (maxDuration != null && maxDuration < 0) {
            throw new ResponseStatusException(BAD_REQUEST, "maxDuration must be >= 0");
        }
        if (minDuration != null && maxDuration != null && minDuration > maxDuration) {
            throw new ResponseStatusException(BAD_REQUEST, "minDuration must be <= maxDuration");
        }

        String searchPattern = search != null && !search.isBlank()
                ? "%" + search.toLowerCase() + "%" : null;
        String categoryLower = category != null && !category.isBlank()
                ? category.toLowerCase() : null;

        return ResponseEntity.ok(salonServiceService.findAllFiltered(
                searchPattern, categoryLower, minPrice, maxPrice, minDuration, maxDuration, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalonServiceResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(salonServiceService.findById(id));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<SalonServiceResponse>> getByCategory(@PathVariable String category) {
        return ResponseEntity.ok(salonServiceService.findByCategory(category));
    }

    @GetMapping("/search")
    public ResponseEntity<List<SalonServiceResponse>> search(@RequestParam String q) {
        return ResponseEntity.ok(salonServiceService.search(q));
    }

    @PostMapping
    public ResponseEntity<SalonServiceResponse> create(@Valid @RequestBody SalonServiceRequest request) {
        SalonServiceResponse created = salonServiceService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SalonServiceResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody SalonServiceRequest request) {
        return ResponseEntity.ok(salonServiceService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        salonServiceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
