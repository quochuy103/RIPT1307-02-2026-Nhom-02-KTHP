package com.cutie_cuts_app.example.cutie_cuts_app.repository;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.Barber;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BarberRepository extends JpaRepository<Barber, Long> {

    @Query("SELECT b FROM Barber b WHERE b.deleted = false ORDER BY b.rating DESC LIMIT ?1")
    List<Barber> findTopRated(int limit);

    List<Barber> findBySpecialtiesContainingIgnoreCase(String specialty);

    List<Barber> findByDeletedFalse();

    @Query("""
            SELECT b FROM Barber b WHERE b.deleted = false AND
            (:search IS NULL OR LOWER(b.name) LIKE :search) AND
            (:specialty IS NULL OR LOWER(b.specialties) LIKE :specialty) AND
            (:minExperience IS NULL OR b.experience >= :minExperience) AND
            (:maxExperience IS NULL OR b.experience <= :maxExperience)
            """)
    Page<Barber> findAllFiltered(@Param("search") String search,
                                  @Param("specialty") String specialty,
                                  @Param("minExperience") Integer minExperience,
                                  @Param("maxExperience") Integer maxExperience,
                                  Pageable pageable);
}
