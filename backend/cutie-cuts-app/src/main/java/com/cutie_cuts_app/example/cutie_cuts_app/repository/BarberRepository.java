package com.cutie_cuts_app.example.cutie_cuts_app.repository;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.Barber;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface BarberRepository extends JpaRepository<Barber, Long> {

    @Query("SELECT b FROM Barber b WHERE b.deleted = false ORDER BY b.rating DESC LIMIT ?1")
    List<Barber> findTopRated(int limit);

    List<Barber> findBySpecialtiesContainingIgnoreCase(String specialty);

    List<Barber> findByDeletedFalse();
}
