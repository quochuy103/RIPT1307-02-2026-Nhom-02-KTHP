package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.review.ReviewRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Booking;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.BarberRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.BookingRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ReviewRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.SalonServiceRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.FORBIDDEN;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private SalonServiceRepository serviceRepository;

    @Mock
    private BarberRepository barberRepository;

    @Mock
    private UserRepository userRepository;

    private ReviewService reviewService;

    @BeforeEach
    void setUp() {
        reviewService = new ReviewService(
                reviewRepository,
                bookingRepository,
                serviceRepository,
                barberRepository,
                userRepository);
    }

    @Test
    void createRejectsRatingBelowOne() {
        ReviewRequest request = baseBookingReviewRequest();
        request.setRating(0);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> reviewService.create(request, 10L));

        assertEquals(BAD_REQUEST, exception.getStatusCode());
        assertEquals("Rating must be at least 1", exception.getReason());
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void createRejectsRatingAboveFive() {
        ReviewRequest request = baseBookingReviewRequest();
        request.setRating(6);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> reviewService.create(request, 10L));

        assertEquals(BAD_REQUEST, exception.getStatusCode());
        assertEquals("Rating must be at most 5", exception.getReason());
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void createRejectsMissingTarget() {
        ReviewRequest request = new ReviewRequest();
        request.setRating(5);
        request.setComment("Great");

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> reviewService.create(request, 10L));

        assertEquals(BAD_REQUEST, exception.getStatusCode());
        assertEquals("Review target is required", exception.getReason());
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void createRejectsForeignBooking() {
        ReviewRequest request = baseBookingReviewRequest();
        Booking booking = createBooking(20L, 99L, "done");

        when(bookingRepository.findById(20L)).thenReturn(Optional.of(booking));
        when(userRepository.getReferenceById(10L)).thenReturn(createUser(10L));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> reviewService.create(request, 10L));

        assertEquals(FORBIDDEN, exception.getStatusCode());
        assertEquals("You can only review your own bookings", exception.getReason());
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void createRejectsIncompleteBooking() {
        ReviewRequest request = baseBookingReviewRequest();
        Booking booking = createBooking(20L, 10L, "pending");

        when(bookingRepository.findById(20L)).thenReturn(Optional.of(booking));
        when(userRepository.getReferenceById(10L)).thenReturn(createUser(10L));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> reviewService.create(request, 10L));

        assertEquals(BAD_REQUEST, exception.getStatusCode());
        assertEquals("Cannot review a booking that is not completed", exception.getReason());
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void createRejectsDuplicateBookingReview() {
        ReviewRequest request = baseBookingReviewRequest();
        Booking booking = createBooking(20L, 10L, "done");

        when(bookingRepository.findById(20L)).thenReturn(Optional.of(booking));
        when(userRepository.getReferenceById(10L)).thenReturn(createUser(10L));
        when(reviewRepository.existsByBookingId(20L)).thenReturn(true);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> reviewService.create(request, 10L));

        assertEquals(CONFLICT, exception.getStatusCode());
        assertEquals("You have already reviewed this booking", exception.getReason());
        verify(reviewRepository, never()).save(any());
    }

    private ReviewRequest baseBookingReviewRequest() {
        ReviewRequest request = new ReviewRequest();
        request.setBookingId(20L);
        request.setRating(5);
        request.setComment("Great");
        return request;
    }

    private Booking createBooking(Long bookingId, Long userId, String status) {
        Booking booking = new Booking();
        ReflectionTestUtils.setField(booking, "id", bookingId);
        booking.setUser(createUser(userId));
        booking.setStatus(status);
        return booking;
    }

    private User createUser(Long userId) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", userId);
        user.setName("Customer");
        return user;
    }
}
