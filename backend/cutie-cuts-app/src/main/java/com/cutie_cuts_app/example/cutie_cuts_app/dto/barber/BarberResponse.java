package com.cutie_cuts_app.example.cutie_cuts_app.dto.barber;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.Barber;
import java.time.LocalDateTime;

public class BarberResponse {

    private final Long id;
    private final String name;
    private final String role;
    private final String image;
    private final Integer experience;
    private final String specialties;
    private final Double rating;
    private final LocalDateTime createdAt;

    public BarberResponse(Long id, String name, String role, String image,
                          Integer experience, String specialties, Double rating,
                          LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.role = role;
        this.image = image;
        this.experience = experience;
        this.specialties = specialties;
        this.rating = rating;
        this.createdAt = createdAt;
    }

    public static BarberResponse from(Barber barber) {
        return new BarberResponse(
                barber.getId(),
                barber.getName(),
                barber.getRole(),
                barber.getImage(),
                barber.getExperience(),
                barber.getSpecialties(),
                barber.getRating(),
                barber.getCreatedAt()
        );
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getRole() { return role; }
    public String getImage() { return image; }
    public Integer getExperience() { return experience; }
    public String getSpecialties() { return specialties; }
    public Double getRating() { return rating; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
