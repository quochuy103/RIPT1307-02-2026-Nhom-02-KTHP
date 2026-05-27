package com.cutie_cuts_app.example.cutie_cuts_app.repository;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.Review;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    @Query("""
            select r
            from Review r
            where r.deleted = false or r.deleted is null
            order by r.createdAt desc
            """)
    List<Review> findVisible();

    List<Review> findByServiceIdAndDeletedFalse(Long serviceId);
    List<Review> findByBarberIdAndDeletedFalse(Long barberId);
    List<Review> findByProductIdAndDeletedFalse(Long productId);

    @Query("""
            select avg(r.rating)
            from Review r
            where r.service.id = :serviceId
              and (r.deleted = false or r.deleted is null)
            """)
    Double findAverageRatingByServiceId(@Param("serviceId") Long serviceId);

    @Query("""
            select avg(r.rating)
            from Review r
            where r.barber.id = :barberId
              and (r.deleted = false or r.deleted is null)
            """)
    Double findAverageRatingByBarberId(@Param("barberId") Long barberId);

    @Query("""
            select avg(r.rating)
            from Review r
            where r.product.id = :productId
              and (r.deleted = false or r.deleted is null)
            """)
    Double findAverageRatingByProductId(@Param("productId") Long productId);

    boolean existsByBookingId(Long bookingId);
    boolean existsByOrderIdAndProductId(Long orderId, Long productId);
    List<Review> findByUser(User user);
    List<Review> findByUserAndDeletedFalse(User user);
}
