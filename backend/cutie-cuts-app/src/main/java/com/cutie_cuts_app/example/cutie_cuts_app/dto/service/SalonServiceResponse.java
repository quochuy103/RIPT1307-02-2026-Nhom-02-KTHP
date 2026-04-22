package com.cutie_cuts_app.example.cutie_cuts_app.dto.service;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.SalonService;
import java.time.LocalDateTime;

public class SalonServiceResponse {

    private final Long id;
    private final String name;
    private final Integer price;
    private final Integer duration;
    private final String category;
    private final String description;
    private final LocalDateTime createdAt;

    public SalonServiceResponse(Long id, String name, Integer price, Integer duration,
                                 String category, String description, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.duration = duration;
        this.category = category;
        this.description = description;
        this.createdAt = createdAt;
    }

    public static SalonServiceResponse from(SalonService service) {
        return new SalonServiceResponse(
                service.getId(),
                service.getName(),
                service.getPrice(),
                service.getDuration(),
                service.getCategory(),
                service.getDescription(),
                service.getCreatedAt()
        );
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public Integer getPrice() { return price; }
    public Integer getDuration() { return duration; }
    public String getCategory() { return category; }
    public String getDescription() { return description; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}