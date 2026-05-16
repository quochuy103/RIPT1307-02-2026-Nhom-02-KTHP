package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.domain.CreateBookingRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.domain.UpdateStatusRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Booking;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.service.BookingService;
import com.cutie_cuts_app.example.cutie_cuts_app.service.CurrentUserService;
import org.springframework.security.core.Authentication;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/bookings")
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:5173"})
public class BookingController {

    private final BookingService bookingService;
    private final CurrentUserService currentUserService;

    public BookingController(BookingService bookingService, CurrentUserService currentUserService) {
        this.bookingService = bookingService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public List<Map<String, Object>> getAll() {
        return bookingService.getBookings().stream().map(this::toResponse).toList();
    }

    @GetMapping("/my")
    public List<Map<String, Object>> myBookings(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }
        User user = currentUserService.getByEmail(authentication.getName());
        return bookingService.getBookingsByUser(user).stream().map(this::toResponse).toList();
    }

    @PostMapping
    public Map<String, Object> create(@Valid @RequestBody CreateBookingRequest request, Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }
        if (request.getServiceId() == null || request.getBarberId() == null
                || request.getDate() == null || request.getTime() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Missing required fields: serviceId, barberId, date, time");
        }
        User user = currentUserService.getByEmail(authentication.getName());
        Booking booking = bookingService.createBooking(user, request);
        return toResponse(booking);
    }

    @PatchMapping("/{id}/status")
    public Map<String, Object> updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateStatusRequest request, Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }
        String newStatus = request.getStatus();
        if (!List.of("pending", "confirmed", "done", "cancelled").contains(newStatus)) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid status. Allowed: pending, confirmed, done, cancelled");
        }
        User user = currentUserService.getByEmail(authentication.getName());

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        Booking booking = bookingService.updateStatus(id, newStatus, user, isAdmin);

        boolean isAdmin = isAdmin(authentication);
        Booking booking = bookingService.updateStatus(id, request.getStatus(), user, isAdmin);

        return toResponse(booking);
    }

    @PostMapping("/{id}/cancel")
    public Map<String, Object> cancel(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }
        User user = currentUserService.getByEmail(authentication.getName());
        Booking booking = bookingService.cancelBooking(id, user, isAdmin(authentication));
        return toResponse(booking);
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
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
