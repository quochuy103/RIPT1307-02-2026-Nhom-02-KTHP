package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.domain.CreateReviewRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.*;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.*;
import com.cutie_cuts_app.example.cutie_cuts_app.service.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:5173"})
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final BarberRepository barberRepository;
    private final SalonServiceRepository serviceRepository;
    private final CurrentUserService currentUserService;

    public ReviewController(
            ReviewRepository reviewRepository,
            BookingRepository bookingRepository,
            BarberRepository barberRepository,
            SalonServiceRepository serviceRepository,
            CurrentUserService currentUserService) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.barberRepository = barberRepository;
        this.serviceRepository = serviceRepository;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public List<Map<String, Object>> getAll() {
        return reviewRepository.findAll().stream().map(this::toResponse).toList();
    }

    @GetMapping("/me")
    public List<Map<String, Object>> getMyReviews(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }
        User user = currentUserService.getByEmail(authentication.getName());
        return reviewRepository.findByUserAndDeletedFalse(user).stream().map(this::toResponse).toList();
    }

    @PostMapping
    public Map<String, Object> create(@Valid @RequestBody CreateReviewRequest request, Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }

        User user = currentUserService.getByEmail(authentication.getName());
        Review review = new Review();
        review.setUser(user);
        review.setRating(request.getRating());
        review.setComment(request.getComment());

        if (request.getBookingId() != null) {
            Booking booking = bookingRepository.findById(request.getBookingId())
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Booking not found"));

            // Validate ownership
            if (!booking.getUser().getId().equals(user.getId())) {
                throw new ResponseStatusException(FORBIDDEN, "You can only review your own bookings");
            }
            // Validate booking is completed
            if (!"done".equals(booking.getStatus())) {
                throw new ResponseStatusException(BAD_REQUEST, "Cannot review a booking that is not completed");
            }
            // Check duplicate
            if (reviewRepository.existsByBookingId(booking.getId())) {
                throw new ResponseStatusException(CONFLICT, "You have already reviewed this booking");
            }

            review.setBooking(booking);
        }
        if (request.getBarberId() != null) {
            Barber barber = barberRepository.findById(request.getBarberId())
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Barber not found"));
            review.setBarber(barber);
        }
        if (request.getServiceId() != null) {
            SalonService service = serviceRepository.findById(request.getServiceId())
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Service not found"));
            review.setService(service);
        }

        Review saved = reviewRepository.save(review);
        return toResponse(saved);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }
        User user = currentUserService.getByEmail(authentication.getName());
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Review not found"));
        if (!review.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "You can only delete your own reviews");
        }
        reviewRepository.deleteById(id);
    }

    private Map<String, Object> toResponse(Review review) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", review.getId());
        map.put("userName", review.getUser().getName());
        map.put("rating", review.getRating());
        map.put("comment", review.getComment());
        map.put("date", String.valueOf(review.getCreatedAt()).substring(0, 10));
        return map;
    }
}
