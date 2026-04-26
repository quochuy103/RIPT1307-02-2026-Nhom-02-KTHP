package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.barber.BarberRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.barber.BarberResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Barber;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.BarberRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class BarberService {

    private final BarberRepository barberRepository;

    public BarberService(BarberRepository barberRepository) {
        this.barberRepository = barberRepository;
    }

    @Transactional(readOnly = true)
    public List<BarberResponse> findAll() {
        return barberRepository.findAll().stream()
                .map(BarberResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<BarberResponse> findAll(Pageable pageable) {
        return barberRepository.findAll(pageable)
                .map(BarberResponse::from);
    }

    @Transactional(readOnly = true)
    public BarberResponse findById(Long id) {
        Barber barber = barberRepository.findById(id)
                .orElseThrow(() -> new BarberNotFoundException(id));
        return BarberResponse.from(barber);
    }

    @Transactional(readOnly = true)
    public boolean existsById(Long id) {
        return barberRepository.existsById(id);
    }

    @Transactional
    public BarberResponse create(BarberRequest request) {
        Barber barber = new Barber();
        barber.setName(request.getName());
        barber.setRole(request.getRole());
        barber.setImage(request.getImage());
        barber.setExperience(request.getExperience());
        barber.setSpecialties(request.getSpecialties());
        barber.setRating(request.getRating() != null ? request.getRating() : 4.8);
        Barber saved = barberRepository.save(barber);
        return BarberResponse.from(saved);
    }

    @Transactional
    public BarberResponse update(Long id, BarberRequest request) {
        Barber barber = barberRepository.findById(id)
                .orElseThrow(() -> new BarberNotFoundException(id));
        barber.setName(request.getName());
        barber.setRole(request.getRole());
        barber.setImage(request.getImage());
        barber.setExperience(request.getExperience());
        barber.setSpecialties(request.getSpecialties());
        if (request.getRating() != null) {
            barber.setRating(request.getRating());
        }
        Barber saved = barberRepository.save(barber);
        return BarberResponse.from(saved);
    }

    @Transactional
    public void delete(Long id) {
        if (!barberRepository.existsById(id)) {
            throw new BarberNotFoundException(id);
        }
        barberRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<BarberResponse> findTopRated(int limit) {
        return barberRepository.findTopRated(limit).stream()
                .map(BarberResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BarberResponse> findBySpecialties(String specialty) {
        return barberRepository.findBySpecialtiesContainingIgnoreCase(specialty).stream()
                .map(BarberResponse::from)
                .collect(Collectors.toList());
    }

    public static class BarberNotFoundException extends ResponseStatusException {
        public BarberNotFoundException(Long id) {
            super(NOT_FOUND, "Barber not found: id=" + id);
        }
    }
}
