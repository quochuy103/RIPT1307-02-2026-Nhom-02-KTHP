package com.cutie_cuts_app.example.cutie_cuts_app.repository;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.GalleryImage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface GalleryImageRepository extends JpaRepository<GalleryImage, Long> {
    List<GalleryImage> findByCategoryAndDeletedFalse(String category);
    List<GalleryImage> findByDeletedFalseOrderByUploadedAtDesc(Pageable pageable);

    @Query("""
            SELECT g FROM GalleryImage g WHERE g.deleted = false AND
            (:category IS NULL OR LOWER(g.category) = :category) AND
            g.uploadedAt >= :uploadedFrom AND
            g.uploadedAt <= :uploadedTo
            """)
    Page<GalleryImage> findAllFiltered(@Param("category") String category,
                                        @Param("uploadedFrom") LocalDateTime uploadedFrom,
                                        @Param("uploadedTo") LocalDateTime uploadedTo,
                                        Pageable pageable);
}
