package com.cutie_cuts_app.example.cutie_cuts_app.repository;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
}
