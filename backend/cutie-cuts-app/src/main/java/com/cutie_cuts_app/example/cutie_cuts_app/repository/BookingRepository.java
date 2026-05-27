package com.cutie_cuts_app.example.cutie_cuts_app.repository;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.Barber;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Booking;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUser(User user);
    Page<Booking> findByUser(User user, Pageable pageable);
    Page<Booking> findByUserAndStatusIgnoreCase(User user, String status, Pageable pageable);
    long countByUser(User user);
    long countByUserAndStatusIgnoreCase(User user, String status);
    long countByUserAndDate(User user, LocalDate date);
    Optional<Booking> findFirstByUserOrderByCreatedAtDesc(User user);
    Optional<Booking> findByBarberAndDateAndTime(Barber barber, LocalDate date, LocalTime time);
    boolean existsByBarberAndDateAndTimeAndStatusNot(Barber barber, LocalDate date, LocalTime time, String status);

    @Query("""
            select count(b)
            from Booking b
            where b.user = :user and b.date = :date and lower(b.status) = lower(:status)
            """)
    long countByUserAndDateWithStatus(
            @Param("user") User user,
            @Param("date") LocalDate date,
            @Param("status") String status);

    @Query("""
            select coalesce(sum(b.price), 0)
            from Booking b
            where b.user = :user and lower(b.status) = lower(:status)
            """)
    Double sumPriceByUserAndStatus(@Param("user") User user, @Param("status") String status);

    @Query("""
            SELECT b FROM Booking b WHERE
            (:status IS NULL OR LOWER(b.status) = :status) AND
            (:barberId IS NULL OR b.barber.id = :barberId) AND
            (:userId IS NULL OR b.user.id = :userId) AND
            (:serviceId IS NULL OR b.service.id = :serviceId) AND
            (:dateFrom IS NULL OR b.date >= :dateFrom) AND
            (:dateTo IS NULL OR b.date <= :dateTo) AND
            (:upcoming IS NULL OR b.date > :todayDate OR (b.date = :todayDate AND b.time >= :nowTime))
            """)
    Page<Booking> findAllFiltered(@Param("status") String status,
                                  @Param("barberId") Long barberId,
                                  @Param("userId") Long userId,
                                  @Param("serviceId") Long serviceId,
                                  @Param("dateFrom") LocalDate dateFrom,
                                  @Param("dateTo") LocalDate dateTo,
                                  @Param("upcoming") Boolean upcoming,
                                  @Param("todayDate") LocalDate todayDate,
                                  @Param("nowTime") LocalTime nowTime,
                                  Pageable pageable);
}
