package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.service.SalonServiceRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.service.SalonServiceResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.SalonService;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.SalonServiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SalonServiceService {

    private final SalonServiceRepository repository;

    public SalonServiceService(SalonServiceRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<SalonServiceResponse> findAll() {
        return repository.findByDeletedFalse().stream()
                .map(SalonServiceResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SalonServiceResponse findById(Long id) {
        SalonService service = repository.findById(id)
                .orElseThrow(() -> new SalonServiceNotFoundException(id));
        return SalonServiceResponse.from(service);
    }

    @Transactional(readOnly = true)
    public List<SalonServiceResponse> findByCategory(String category) {
        return repository.findByCategoryIgnoreCase(category).stream()
                .map(SalonServiceResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SalonServiceResponse> search(String name) {
        return repository.findByNameContainingIgnoreCase(name).stream()
                .map(SalonServiceResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public SalonServiceResponse create(SalonServiceRequest request) {
        SalonService service = new SalonService();
        service.setName(request.getName());
        service.setPrice(request.getPrice());
        service.setDuration(request.getDuration());
        service.setCategory(request.getCategory());
        service.setDescription(request.getDescription());
        service.setImage(request.getImage());
        SalonService saved = repository.save(service);
        return SalonServiceResponse.from(saved);
    }

    @Transactional
    public SalonServiceResponse update(Long id, SalonServiceRequest request) {
        SalonService service = repository.findById(id)
                .orElseThrow(() -> new SalonServiceNotFoundException(id));
        service.setName(request.getName());
        service.setPrice(request.getPrice());
        service.setDuration(request.getDuration());
        service.setCategory(request.getCategory());
        service.setDescription(request.getDescription());
        if (request.getImage() != null) {
            service.setImage(request.getImage());
        }
        SalonService saved = repository.save(service);
        return SalonServiceResponse.from(saved);
    }

    @Transactional
    public void delete(Long id) {
        SalonService service = repository.findById(id)
                .orElseThrow(() -> new SalonServiceNotFoundException(id));
        service.setDeleted(true);
        service.setDeletedAt(java.time.LocalDateTime.now());
    }

    public static class SalonServiceNotFoundException extends RuntimeException {
        public SalonServiceNotFoundException(Long id) {
            super("SalonService not found: id=" + id);
        }
    }
}