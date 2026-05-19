package com.cutie_cuts_app.example.cutie_cuts_app.repository;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.Barber;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Booking;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUser(User user);
    Optional<Booking> findByBarberAndDateAndTime(Barber barber, LocalDate date, LocalTime time);
    boolean existsByBarberAndDateAndTimeAndStatusNot(Barber barber, LocalDate date, LocalTime time, String status);
    long countByUserAndStatusAndCancelledAtBetween(User user, String status, LocalDateTime start, LocalDateTime end);
}
