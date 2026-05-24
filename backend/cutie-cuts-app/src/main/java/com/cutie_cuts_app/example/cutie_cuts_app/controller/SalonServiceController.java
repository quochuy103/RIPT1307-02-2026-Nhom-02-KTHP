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

import java.util.List;

@RestController
@RequestMapping("/api/services")
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:5173"})
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
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(salonServiceService.findAllPaginated(pageable));
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