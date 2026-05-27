package com.cutie_cuts_app.example.cutie_cuts_app.repository;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategoryIgnoreCase(String category);
    List<Product> findByNameContainingIgnoreCase(String name);
    List<Product> findByDeletedFalse();

    @Modifying
    @Query("UPDATE Product p SET p.stock = p.stock - :qty WHERE p.id = :id AND p.stock >= :qty")
    int deductStock(@Param("id") Long id, @Param("qty") int qty);

    @Query("""
            SELECT p FROM Product p WHERE p.deleted = false AND
            (:search IS NULL OR LOWER(p.name) LIKE :search) AND
            (:category IS NULL OR LOWER(p.category) = :category) AND
            (:minPrice IS NULL OR p.price >= :minPrice) AND
            (:maxPrice IS NULL OR p.price <= :maxPrice) AND
            (:inStock IS NULL OR (:inStock = true AND p.stock > 0) OR (:inStock = false AND p.stock <= 0))
            """)
    Page<Product> findAllFiltered(@Param("search") String search,
                                  @Param("category") String category,
                                  @Param("minPrice") Double minPrice,
                                  @Param("maxPrice") Double maxPrice,
                                  @Param("inStock") Boolean inStock,
                                  Pageable pageable);
}
