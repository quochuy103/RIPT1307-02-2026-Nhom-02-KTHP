package com.cutie_cuts_app.example.cutie_cuts_app.repository;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.SalonService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SalonServiceRepository extends JpaRepository<SalonService, Long> {
    List<SalonService> findByCategoryIgnoreCase(String category);
    List<SalonService> findByNameContainingIgnoreCase(String name);
    List<SalonService> findByDeletedFalse();

    @Query("""
            SELECT s FROM SalonService s WHERE s.deleted = false AND
            (:search IS NULL OR LOWER(s.name) LIKE :search OR LOWER(s.category) LIKE :search) AND
            (:category IS NULL OR LOWER(s.category) = :category) AND
            (:minPrice IS NULL OR s.price >= :minPrice) AND
            (:maxPrice IS NULL OR s.price <= :maxPrice) AND
            (:minDuration IS NULL OR s.duration >= :minDuration) AND
            (:maxDuration IS NULL OR s.duration <= :maxDuration)
            """)
    Page<SalonService> findAllFiltered(@Param("search") String search,
                                       @Param("category") String category,
                                       @Param("minPrice") Integer minPrice,
                                       @Param("maxPrice") Integer maxPrice,
                                       @Param("minDuration") Integer minDuration,
                                       @Param("maxDuration") Integer maxDuration,
                                       Pageable pageable);
}