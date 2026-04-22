package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.barber.BarberRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.barber.BarberResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.service.BarberService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/barbers")
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:5173"})
public class BarberController {

    private final BarberService barberService;

    public BarberController(BarberService barberService) {
        this.barberService = barberService;
    }

    @GetMapping
    public ResponseEntity<List<BarberResponse>> getAll() {
        return ResponseEntity.ok(barberService.findAll());
    }

    @GetMapping("/paginated")
    public ResponseEntity<Page<BarberResponse>> getAllPaginated(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(barberService.findAll(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BarberResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(barberService.findById(id));
    }

    @GetMapping("/top")
    public ResponseEntity<List<BarberResponse>> getTopRated(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(barberService.findTopRated(limit));
    }

    @GetMapping("/search")
    public ResponseEntity<List<BarberResponse>> searchBySpecialty(
            @RequestParam String specialty) {
        return ResponseEntity.ok(barberService.findBySpecialties(specialty));
    }

    @PostMapping
    public ResponseEntity<BarberResponse> create(@Valid @RequestBody BarberRequest request) {
        BarberResponse created = barberService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BarberResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody BarberRequest request) {
        return ResponseEntity.ok(barberService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        barberService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
