package com.cutie_cuts_app.example.cutie_cuts_app.repository;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.ReviewTargetRating;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.ReviewTargetType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewTargetRatingRepository extends JpaRepository<ReviewTargetRating, Long> {

    List<ReviewTargetRating> findByReviewId(Long reviewId);

    @Query("""
            select avg(r.rating)
            from ReviewTargetRating r
            where r.targetType = :targetType
              and r.targetId = :targetId
            """)
    Double findAverageRatingByTarget(
            @Param("targetType") ReviewTargetType targetType,
            @Param("targetId") Long targetId);
}
