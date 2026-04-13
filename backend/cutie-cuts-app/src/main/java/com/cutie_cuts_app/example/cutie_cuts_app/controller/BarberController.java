package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.Barber;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.BarberRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/barbers")
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:5173"})
public class BarberController {

    private final BarberRepository barberRepository;

    public BarberController(BarberRepository barberRepository) {
        this.barberRepository = barberRepository;
    }

    @GetMapping
    public List<Barber> getAll() {
        return barberRepository.findAll();
    }

    @PostMapping
    public Barber create(@RequestBody Barber body) {
        return barberRepository.save(body);
    }

    @PutMapping("/{id}")
    public Barber update(@PathVariable Long id, @RequestBody Barber body) {
        Barber existing = barberRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Barber not found"));

        existing.setName(body.getName());
        existing.setRole(body.getRole());
        existing.setImage(body.getImage());
        existing.setExperience(body.getExperience());
        existing.setSpecialties(body.getSpecialties());
        existing.setRating(body.getRating());
        return barberRepository.save(existing);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        if (!barberRepository.existsById(id)) {
            throw new ResponseStatusException(NOT_FOUND, "Barber not found");
        }
        barberRepository.deleteById(id);
    }
}
