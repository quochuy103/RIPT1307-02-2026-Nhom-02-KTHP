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

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class BarberService {

    private final BarberRepository barberRepository;
    private final ImageStorageService imageStorageService;
    private final PresignService presignService;
    private final S3StorageService s3StorageService;

    public BarberService(BarberRepository barberRepository, ImageStorageService imageStorageService,
                         PresignService presignService, S3StorageService s3StorageService) {
        this.barberRepository = barberRepository;
        this.imageStorageService = imageStorageService;
        this.presignService = presignService;
        this.s3StorageService = s3StorageService;
    }

    @Transactional(readOnly = true)
    public List<BarberResponse> findAll() {
        return barberRepository.findByDeletedFalse().stream()
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
        barber.setImage(resolveBarberImage(request));
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
        String oldImage = barber.getImage();
        barber.setName(request.getName());
        barber.setRole(request.getRole());
        String newImage = resolveBarberImage(request);
        barber.setImage(newImage);
        barber.setExperience(request.getExperience());
        barber.setSpecialties(request.getSpecialties());
        if (request.getRating() != null) {
            barber.setRating(request.getRating());
        }
        Barber saved = barberRepository.save(barber);

        if (oldImage != null && !oldImage.isBlank() && !oldImage.equals(newImage)) {
            imageStorageService.deleteImage(oldImage);
        }

        return BarberResponse.from(saved);
    }

    @Transactional
    public void delete(Long id) {
        Barber barber = barberRepository.findById(id)
                .orElseThrow(() -> new BarberNotFoundException(id));
        imageStorageService.deleteImage(barber.getImage());
        barber.setDeleted(true);
        barber.setDeletedAt(java.time.LocalDateTime.now());
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

    private String resolveBarberImage(BarberRequest request) {
        if (request.getObjectKey() != null && !request.getObjectKey().isBlank()) {
            presignService.validateObjectKeyForContext("BARBER", request.getObjectKey());

            if (request.getContentType() != null && !PresignService.ALLOWED_CONTENT_TYPES.contains(request.getContentType())) {
                throw new ResponseStatusException(BAD_REQUEST,
                        "Unsupported content type. Allowed: image/jpeg, image/png, image/webp, image/gif");
            }
            if (request.getFileSize() != null && (request.getFileSize() <= 0 || request.getFileSize() > PresignService.MAX_IMAGE_SIZE)) {
                throw new ResponseStatusException(BAD_REQUEST,
                        "File size must be between 1 byte and 5 MB");
            }

            String bucket = presignService.bucketForContext("BARBER");
            if (!s3StorageService.objectExists(bucket, request.getObjectKey())) {
                throw new ResponseStatusException(BAD_REQUEST, "Uploaded object not found in storage");
            }

            return presignService.derivePublicUrl("BARBER", request.getObjectKey());
        }

        // Legacy: manual URL or data URL — backward compat, not part of presigned upload security model
        String rawImage = request.getImage() != null && !request.getImage().isBlank() ? request.getImage() : request.getAvatar();
        return imageStorageService.storeImage(rawImage, ImageStorageService.ImageContext.BARBER).url();
    }

    public static class BarberNotFoundException extends ResponseStatusException {
        public BarberNotFoundException(Long id) {
            super(NOT_FOUND, "Barber not found: id=" + id);
        }
    }
}
