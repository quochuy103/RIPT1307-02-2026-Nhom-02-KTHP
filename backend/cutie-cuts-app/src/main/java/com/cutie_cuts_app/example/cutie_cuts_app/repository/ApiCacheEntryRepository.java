package com.cutie_cuts_app.example.cutie_cuts_app.repository;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.ApiCacheEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface ApiCacheEntryRepository extends JpaRepository<ApiCacheEntry, Long> {
    Optional<ApiCacheEntry> findByCacheKeyAndExpiresAtAfter(String cacheKey, LocalDateTime now);

    Optional<ApiCacheEntry> findByCacheKey(String cacheKey);

    long deleteByExpiresAtBefore(LocalDateTime now);
}
