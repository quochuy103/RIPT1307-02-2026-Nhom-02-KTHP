package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.SalonService;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.SalonServiceRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/services")
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:5173"})
public class SalonServiceController {

    private final SalonServiceRepository salonServiceRepository;

    public SalonServiceController(SalonServiceRepository salonServiceRepository) {
        this.salonServiceRepository = salonServiceRepository;
    }

    @GetMapping
    public List<SalonService> getAll() {
        return salonServiceRepository.findAll();
    }

    @PostMapping
    public SalonService create(@RequestBody SalonService body) {
        body.setId(null);
        return salonServiceRepository.save(body);
    }

    @PutMapping("/{id}")
    public SalonService update(@PathVariable Long id, @RequestBody SalonService body) {
        SalonService existing = salonServiceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Service not found"));

        existing.setName(body.getName());
        existing.setCategory(body.getCategory());
        existing.setDescription(body.getDescription());
        existing.setDuration(body.getDuration());
        existing.setPrice(body.getPrice());
        return salonServiceRepository.save(existing);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        if (!salonServiceRepository.existsById(id)) {
            throw new ResponseStatusException(NOT_FOUND, "Service not found");
        }
        salonServiceRepository.deleteById(id);
    }
}
