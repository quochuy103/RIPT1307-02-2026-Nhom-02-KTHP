package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.domain.CreateBookingRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Barber;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Booking;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.SalonService;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.exception.SlotAlreadyBookedException;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.BarberRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.BookingRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.SalonServiceRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.util.DomainStatusRules;
import com.cutie_cuts_app.example.cutie_cuts_app.util.NotificationType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class BookingService {

    private static final int MAX_DAILY_CANCELLATIONS = 3;
    private static final long MIN_CANCEL_NOTICE_MINUTES = 30;
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final BookingRepository bookingRepository;
    private final SalonServiceRepository salonServiceRepository;
    private final BarberRepository barberRepository;
    private final NotificationService notificationService;
    private final Clock clock;

    @Autowired
    public BookingService(
            BookingRepository bookingRepository,
            SalonServiceRepository salonServiceRepository,
            BarberRepository barberRepository,
            NotificationService notificationService) {
        this(bookingRepository, salonServiceRepository, barberRepository, notificationService, Clock.system(BUSINESS_ZONE));
    }

    BookingService(
            BookingRepository bookingRepository,
            SalonServiceRepository salonServiceRepository,
            BarberRepository barberRepository,
            NotificationService notificationService,
            Clock clock) {
        this.bookingRepository = bookingRepository;
        this.salonServiceRepository = salonServiceRepository;
        this.barberRepository = barberRepository;
        this.notificationService = notificationService;
        this.clock = clock;
    }

    public List<Booking> getBookings() {
        return bookingRepository.findAll();
    }

    public List<Booking> getBookingsByUser(User user) {
        return bookingRepository.findByUser(user);
    }

    public Booking createBooking(User user, CreateBookingRequest request) {
        SalonService service = salonServiceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Service not found"));
        Barber barber = barberRepository.findById(request.getBarberId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Barber not found"));

        if (bookingRepository.existsByBarberAndDateAndTimeAndStatusNot(
                barber,
                request.getDate(),
                request.getTime(),
                "cancelled")) {
            throw new SlotAlreadyBookedException();
        }

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setService(service);
        booking.setBarber(barber);
        booking.setDate(request.getDate());
        booking.setTime(request.getTime());
        booking.setPrice(service.getPrice().doubleValue());

        Booking saved = bookingRepository.save(booking);
        notificationService.notify(user, NotificationType.BOOKING_CREATED,
                "Booking created for " + service.getName() + " with " + barber.getName() + " on " + request.getDate() + " at " + request.getTime(),
                "booking", saved.getId());
        return saved;
    }

    public Booking updateStatus(Long id, String status, User user, boolean isAdmin) {
        if (!isAdmin) {
            throw new ResponseStatusException(FORBIDDEN, "Only admins can update booking status");
        }

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Booking not found"));
        String normalizedStatus = DomainStatusRules.normalizeBookingStatusForUpdate(status);

        booking.setStatus(normalizedStatus);
        Booking saved = bookingRepository.save(booking);
        notificationService.notify(booking.getUser(), NotificationType.BOOKING_STATUS_UPDATED,
                "Booking status updated to: " + normalizedStatus,
                "booking", saved.getId());
        return saved;
    }

    @Transactional
    public Booking cancelBooking(Long id, User user, boolean isAdmin) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Booking not found"));
        if (!isAdmin && !booking.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "You can only cancel your own bookings");
        }

        String currentStatus = DomainStatusRules.normalizeCurrentStatus(booking.getStatus(), "Booking");
        DomainStatusRules.ensureBookingCanBeCancelled(currentStatus);
        if (!isAdmin) {
            enforceCancellationWindow(booking);
            enforceDailyCancellationLimit(user);
        }

        booking.setStatus("cancelled");
        booking.setCancelledAt(LocalDateTime.now(clock));
        Booking saved = bookingRepository.save(booking);
        notificationService.notify(booking.getUser(), NotificationType.BOOKING_CANCELLED,
                "Booking cancelled for " + booking.getService().getName() + " with " + booking.getBarber().getName(),
                "booking", saved.getId());
        return saved;
    }

    private void enforceCancellationWindow(Booking booking) {
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime bookingDateTime = LocalDateTime.of(booking.getDate(), booking.getTime());
        if (bookingDateTime.isBefore(now.plusMinutes(MIN_CANCEL_NOTICE_MINUTES))) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Bookings can only be cancelled at least 30 minutes before the appointment");
        }
    }

    private void enforceDailyCancellationLimit(User user) {
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1).minusNanos(1);
        long cancelledCount = bookingRepository.countByUserAndStatusAndCancelledAtBetween(
                user,
                "cancelled",
                startOfDay,
                endOfDay);
        if (cancelledCount >= MAX_DAILY_CANCELLATIONS) {
            throw new ResponseStatusException(BAD_REQUEST, "You can cancel at most 3 bookings per day");
        }
    }
}
