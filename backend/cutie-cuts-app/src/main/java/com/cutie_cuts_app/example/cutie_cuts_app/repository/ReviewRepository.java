package com.cutie_cuts_app.example.cutie_cuts_app.repository;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.Review;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
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

    @Query("""
            SELECT r FROM Review r WHERE
            (r.deleted = false OR r.deleted IS NULL) AND
            (:productId IS NULL OR r.product.id = :productId) AND
            (:serviceId IS NULL OR r.service.id = :serviceId) AND
            (:barberId IS NULL OR r.barber.id = :barberId) AND
            (:userId IS NULL OR r.user.id = :userId) AND
            (:orderId IS NULL OR r.order.id = :orderId) AND
            (:minRating IS NULL OR r.rating >= :minRating) AND
            (:maxRating IS NULL OR r.rating <= :maxRating) AND
            r.createdAt >= :createdFrom AND
            r.createdAt <= :createdTo
            """)
    Page<Review> findAllFiltered(@Param("productId") Long productId,
                                  @Param("serviceId") Long serviceId,
                                  @Param("barberId") Long barberId,
                                  @Param("userId") Long userId,
                                  @Param("orderId") Long orderId,
                                  @Param("minRating") Integer minRating,
                                  @Param("maxRating") Integer maxRating,
                                  @Param("createdFrom") LocalDateTime createdFrom,
                                  @Param("createdTo") LocalDateTime createdTo,
                                  Pageable pageable);
}
