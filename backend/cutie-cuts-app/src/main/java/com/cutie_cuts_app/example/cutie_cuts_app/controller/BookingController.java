package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.domain.CreateBookingRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.domain.UpdateStatusRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.*;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.BarberRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.BookingRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.SalonServiceRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.service.CurrentUserService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/bookings")
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:5173"})
public class BookingController {

    private final BookingRepository bookingRepository;
    private final SalonServiceRepository salonServiceRepository;
    private final BarberRepository barberRepository;
    private final CurrentUserService currentUserService;

    public BookingController(BookingRepository bookingRepository, SalonServiceRepository salonServiceRepository, BarberRepository barberRepository, CurrentUserService currentUserService) {
        this.bookingRepository = bookingRepository;
        this.salonServiceRepository = salonServiceRepository;
        this.barberRepository = barberRepository;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public List<Map<String, Object>> getAll() {
        return bookingRepository.findAll().stream().map(this::toResponse).toList();
    }

    @GetMapping("/my")
    public List<Map<String, Object>> myBookings(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }
        User user = currentUserService.getByEmail(authentication.getName());
        return bookingRepository.findByUser(user).stream().map(this::toResponse).toList();
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody CreateBookingRequest request, Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }

        User user = currentUserService.getByEmail(authentication.getName());
        SalonService service = salonServiceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Service not found"));
        Barber barber = barberRepository.findById(request.getBarberId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Barber not found"));

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setService(service);
        booking.setBarber(barber);
        booking.setDate(request.getDate());
        booking.setTime(request.getTime());
        booking.setPrice(service.getPrice());

        return toResponse(bookingRepository.save(booking));
    }

    @PatchMapping("/{id}/status")
    public Map<String, Object> updateStatus(@PathVariable Long id, @RequestBody UpdateStatusRequest request) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Booking not found"));

        booking.setStatus(request.getStatus());
        return toResponse(bookingRepository.save(booking));
    }

    private Map<String, Object> toResponse(Booking booking) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", booking.getId());
        map.put("userId", booking.getUser().getId());
        map.put("userName", booking.getUser().getName());
        map.put("serviceId", booking.getService().getId());
        map.put("serviceName", booking.getService().getName());
        map.put("barberId", booking.getBarber().getId());
        map.put("barberName", booking.getBarber().getName());
        map.put("date", booking.getDate().toString());
        map.put("time", booking.getTime());
        map.put("status", booking.getStatus());
        map.put("price", booking.getPrice());
        return map;
    }
}
