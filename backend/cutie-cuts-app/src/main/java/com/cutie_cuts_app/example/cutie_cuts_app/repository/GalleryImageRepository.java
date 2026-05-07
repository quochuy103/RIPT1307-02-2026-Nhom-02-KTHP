package com.cutie_cuts_app.example.cutie_cuts_app.repository;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.GalleryImage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GalleryImageRepository extends JpaRepository<GalleryImage, Long> {
    List<GalleryImage> findByCategoryAndDeletedFalse(String category);
    List<GalleryImage> findByDeletedFalseOrderByUploadedAtDesc(Pageable pageable);
}
