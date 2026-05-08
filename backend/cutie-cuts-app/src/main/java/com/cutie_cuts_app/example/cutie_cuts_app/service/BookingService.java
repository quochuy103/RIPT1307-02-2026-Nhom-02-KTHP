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
import com.cutie_cuts_app.example.cutie_cuts_app.util.NotificationType;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final SalonServiceRepository salonServiceRepository;
    private final BarberRepository barberRepository;
    private final NotificationService notificationService;

    public BookingService(
            BookingRepository bookingRepository,
            SalonServiceRepository salonServiceRepository,
            BarberRepository barberRepository,
            NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.salonServiceRepository = salonServiceRepository;
        this.barberRepository = barberRepository;
        this.notificationService = notificationService;
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

        if (bookingRepository.existsByBarberAndDateAndTime(barber, request.getDate(), request.getTime())) {
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
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Booking not found"));
        if (!isAdmin && !booking.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "You can only update your own bookings");
        }
        booking.setStatus(status);
        Booking saved = bookingRepository.save(booking);
        notificationService.notify(booking.getUser(), NotificationType.BOOKING_STATUS_UPDATED,
                "Booking status updated to: " + status,
                "booking", saved.getId());
        return saved;
    }
}
