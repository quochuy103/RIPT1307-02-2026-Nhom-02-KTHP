package com.cutie_cuts_app.example.cutie_cuts_app.repository;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.SalonService;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SalonServiceRepository extends JpaRepository<SalonService, Long> {
    List<SalonService> findByCategoryIgnoreCase(String category);
    List<SalonService> findByNameContainingIgnoreCase(String name);
    List<SalonService> findByDeletedFalse();
}