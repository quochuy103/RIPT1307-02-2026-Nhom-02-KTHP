package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.review.ReviewRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.review.ReviewResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.*;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.FORBIDDEN;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final SalonServiceRepository serviceRepository;
    private final BarberRepository barberRepository;
    private final UserRepository userRepository;

    public ReviewService(ReviewRepository reviewRepository, BookingRepository bookingRepository,
                         SalonServiceRepository serviceRepository, BarberRepository barberRepository,
                         UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.serviceRepository = serviceRepository;
        this.barberRepository = barberRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> findAll(int page, int size) {
        Page<Review> reviews = reviewRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return reviews.stream()
                .filter(r -> r.getDeleted() == null || !r.getDeleted())
                .map(ReviewResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> findByServiceId(Long serviceId) {
        List<Review> reviews = reviewRepository.findByServiceIdAndDeletedFalse(serviceId);
        List<ReviewResponse> responses = reviews.stream()
                .map(ReviewResponse::from)
                .collect(Collectors.toList());

        if (!responses.isEmpty()) {
            Double avg = reviewRepository.findAverageRatingByServiceId(serviceId);
            responses.forEach(r -> r.setAverageRating(avg));
        }
        return responses;
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> findByBarberId(Long barberId) {
        List<Review> reviews = reviewRepository.findByBarberIdAndDeletedFalse(barberId);
        List<ReviewResponse> responses = reviews.stream()
                .map(ReviewResponse::from)
                .collect(Collectors.toList());

        if (!responses.isEmpty()) {
            Double avg = reviewRepository.findAverageRatingByBarberId(barberId);
            responses.forEach(r -> r.setAverageRating(avg));
        }
        return responses;
    }

    @Transactional
    public ReviewResponse create(ReviewRequest request, Long userId) {
        validateReviewRequest(request);

        User user = userRepository.getReferenceById(userId);

        Review review = new Review();
        review.setUser(user);
        review.setRating(request.getRating());
        review.setComment(request.getComment());

        if (request.getBookingId() != null) {
            Booking booking = bookingRepository.findById(request.getBookingId())
                    .orElseThrow(() -> new ResponseStatusException(
                            org.springframework.http.HttpStatus.NOT_FOUND, "Booking not found"));
            if (!booking.getUser().getId().equals(userId)) {
                throw new ResponseStatusException(FORBIDDEN, "You can only review your own bookings");
            }
            if (!"done".equalsIgnoreCase(booking.getStatus())) {
                throw new ResponseStatusException(BAD_REQUEST, "Cannot review a booking that is not completed");
            }
            if (reviewRepository.existsByBookingId(booking.getId())) {
                throw new ResponseStatusException(CONFLICT, "You have already reviewed this booking");
            }
            review.setBooking(booking);
            review.setService(booking.getService());
            review.setBarber(booking.getBarber());
        } else {
            if (request.getServiceId() != null) {
                SalonService service = serviceRepository.findById(request.getServiceId())
                        .orElseThrow(() -> new ResponseStatusException(
                                org.springframework.http.HttpStatus.NOT_FOUND, "Service not found"));
                review.setService(service);
            }
            if (request.getBarberId() != null) {
                Barber barber = barberRepository.findById(request.getBarberId())
                        .orElseThrow(() -> new ResponseStatusException(
                                org.springframework.http.HttpStatus.NOT_FOUND, "Barber not found"));
                review.setBarber(barber);
            }
        }

        Review saved = reviewRepository.save(review);
        return ReviewResponse.from(saved);
    }

    private void validateReviewRequest(ReviewRequest request) {
        if (request.getRating() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Rating is required");
        }
        if (request.getRating() < 1) {
            throw new ResponseStatusException(BAD_REQUEST, "Rating must be at least 1");
        }
        if (request.getRating() > 5) {
            throw new ResponseStatusException(BAD_REQUEST, "Rating must be at most 5");
        }
        if (request.getComment() == null || request.getComment().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Comment is required");
        }
        if (request.getBookingId() == null && request.getServiceId() == null && request.getBarberId() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Review target is required");
        }
    }

    @Transactional
    public void delete(Long id, Long userId, String userRole) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Review not found"));

        if (!review.getUser().getId().equals(userId) && !"ADMIN".equals(userRole)) {
            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Not authorized to delete this review");
        }

        review.setDeleted(true);
        review.setDeletedAt(LocalDateTime.now());
        reviewRepository.save(review);
    }
}
