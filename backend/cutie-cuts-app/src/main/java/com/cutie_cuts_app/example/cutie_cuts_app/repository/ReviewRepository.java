package com.cutie_cuts_app.example.cutie_cuts_app.repository;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.Review;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByServiceIdAndDeletedFalse(Long serviceId);
    List<Review> findByBarberIdAndDeletedFalse(Long barberId);
    Double findAverageRatingByServiceId(Long serviceId);
    Double findAverageRatingByBarberId(Long barberId);
    boolean existsByBookingId(Long bookingId);
    List<Review> findByUser(User user);
    List<Review> findByUserAndDeletedFalse(User user);
}
