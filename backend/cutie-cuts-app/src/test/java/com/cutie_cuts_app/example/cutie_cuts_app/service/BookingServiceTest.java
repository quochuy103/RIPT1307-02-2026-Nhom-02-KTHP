package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.domain.CreateBookingRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Barber;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Booking;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.SalonService;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.BarberRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.BookingRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.SalonServiceRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.util.NotificationType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.FORBIDDEN;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private SalonServiceRepository salonServiceRepository;

    @Mock
    private BarberRepository barberRepository;

    @Mock
    private NotificationService notificationService;

    private BookingService bookingService;
    private Clock fixedClock;

    @BeforeEach
    void setUp() {
        fixedClock = Clock.fixed(Instant.parse("2026-05-16T02:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"));
        bookingService = new BookingService(
                bookingRepository,
                salonServiceRepository,
                barberRepository,
                notificationService,
                fixedClock);
    }

    @Test
    void createBookingIgnoresCancelledSlots() {
        User user = createUser(10L, "Customer");
        Barber barber = createBarber(20L, "Barber A");
        SalonService service = createSalonService(30L, "Haircut", 120);
        CreateBookingRequest request = new CreateBookingRequest();
        request.setBarberId(20L);
        request.setServiceId(30L);
        request.setDate(LocalDate.of(2026, 5, 20));
        request.setTime(LocalTime.of(10, 0));

        when(barberRepository.findById(20L)).thenReturn(Optional.of(barber));
        when(salonServiceRepository.findById(30L)).thenReturn(Optional.of(service));
        when(bookingRepository.existsByUserAndDateAndStatusNot(user, request.getDate(), "cancelled")).thenReturn(false);
        when(bookingRepository.existsByBarberAndDateAndTimeAndStatusNot(
                barber,
                request.getDate(),
                request.getTime(),
                "cancelled")).thenReturn(false);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking booking = bookingService.createBooking(user, request);

        assertEquals("pending", booking.getStatus());
        verify(bookingRepository).existsByBarberAndDateAndTimeAndStatusNot(
                barber,
                request.getDate(),
                request.getTime(),
                "cancelled");
    }

    @Test
    void createBookingRejectsSecondActiveBookingForSameDay() {
        User user = createUser(10L, "Customer");
        Barber barber = createBarber(20L, "Barber A");
        SalonService service = createSalonService(30L, "Haircut", 120);
        CreateBookingRequest request = new CreateBookingRequest();
        request.setBarberId(20L);
        request.setServiceId(30L);
        request.setDate(LocalDate.of(2026, 5, 20));
        request.setTime(LocalTime.of(10, 0));

        when(barberRepository.findById(20L)).thenReturn(Optional.of(barber));
        when(salonServiceRepository.findById(30L)).thenReturn(Optional.of(service));
        when(bookingRepository.existsByUserAndDateAndStatusNot(user, request.getDate(), "cancelled")).thenReturn(true);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> bookingService.createBooking(user, request));

        assertEquals("You can only book one appointment per day", exception.getReason());
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void updateStatusRejectsNonAdminUsers() {
        User user = createUser(10L, "Customer");

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> bookingService.updateStatus(1L, "done", user, false));

        assertEquals(FORBIDDEN, exception.getStatusCode());
        verify(bookingRepository, never()).findById(any());
    }

    @Test
    void cancelBookingAllowsOwnerAndSendsCancelledNotification() {
        User owner = createUser(10L, "Customer");
        Booking booking = createBooking(1L, owner, "pending");

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(bookingRepository.countByUserAndStatusAndCancelledAtBetween(
                eq(owner),
                eq("cancelled"),
                any(LocalDateTime.class),
                any(LocalDateTime.class))).thenReturn(0L);
        when(bookingRepository.save(booking)).thenReturn(booking);

        Booking cancelled = bookingService.cancelBooking(1L, owner, false);

        assertEquals("cancelled", cancelled.getStatus());
        assertEquals(LocalDateTime.now(fixedClock), cancelled.getCancelledAt());
        verify(notificationService).notify(
                eq(owner),
                eq(NotificationType.BOOKING_CANCELLED),
                contains("Booking cancelled"),
                eq("booking"),
                eq(1L));
    }

    @Test
    void cancelBookingRejectsDifferentUser() {
        User owner = createUser(10L, "Customer");
        User otherUser = createUser(11L, "Another User");
        Booking booking = createBooking(1L, owner, "pending");

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> bookingService.cancelBooking(1L, otherUser, false));

        assertEquals(FORBIDDEN, exception.getStatusCode());
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void cancelBookingRejectsFourthCancellationInSameDay() {
        User owner = createUser(10L, "Customer");
        Booking booking = createBooking(1L, owner, "pending");

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(bookingRepository.countByUserAndStatusAndCancelledAtBetween(
                eq(owner),
                eq("cancelled"),
                any(LocalDateTime.class),
                any(LocalDateTime.class))).thenReturn(3L);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> bookingService.cancelBooking(1L, owner, false));

        assertEquals("You can cancel at most 3 bookings per day", exception.getReason());
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void cancelBookingRejectsBookingsWithinThirtyMinutes() {
        User owner = createUser(10L, "Customer");
        Booking booking = createBooking(1L, owner, "pending");
        booking.setDate(LocalDate.of(2026, 5, 16));
        booking.setTime(LocalTime.of(9, 20));

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> bookingService.cancelBooking(1L, owner, false));

        assertEquals("Bookings can only be cancelled at least 30 minutes before the appointment",
                exception.getReason());
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void cancelBookingAllowsAdminsToBypassSpamChecks() {
        User owner = createUser(10L, "Customer");
        User admin = createUser(99L, "Admin");
        Booking booking = createBooking(1L, owner, "pending");
        booking.setDate(LocalDate.of(2026, 5, 16));
        booking.setTime(LocalTime.of(9, 10));

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(booking)).thenReturn(booking);

        Booking cancelled = bookingService.cancelBooking(1L, admin, true);

        assertEquals("cancelled", cancelled.getStatus());
        verify(bookingRepository, never()).countByUserAndStatusAndCancelledAtBetween(
                any(),
                any(),
                any(),
                any());
    }

    private Booking createBooking(Long bookingId, User user, String status) {
        Booking booking = new Booking();
        ReflectionTestUtils.setField(booking, "id", bookingId);
        booking.setUser(user);
        booking.setStatus(status);
        booking.setBarber(createBarber(20L, "Barber A"));
        booking.setService(createSalonService(30L, "Haircut", 120));
        booking.setDate(LocalDate.of(2026, 5, 20));
        booking.setTime(LocalTime.of(10, 0));
        booking.setPrice(120.0);
        return booking;
    }

    private User createUser(Long id, String name) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", id);
        user.setName(name);
        return user;
    }

    private Barber createBarber(Long id, String name) {
        Barber barber = new Barber();
        ReflectionTestUtils.setField(barber, "id", id);
        barber.setName(name);
        barber.setRole("Barber");
        barber.setImage("barber.png");
        barber.setExperience(3);
        barber.setSpecialties("Fade");
        return barber;
    }

    private SalonService createSalonService(Long id, String name, int price) {
        SalonService service = new SalonService();
        service.setId(id);
        service.setName(name);
        service.setPrice(price);
        service.setDuration(45);
        service.setCategory("Hair");
        service.setDescription("Haircut service");
        service.setImage("service.png");
        return service;
    }
}
