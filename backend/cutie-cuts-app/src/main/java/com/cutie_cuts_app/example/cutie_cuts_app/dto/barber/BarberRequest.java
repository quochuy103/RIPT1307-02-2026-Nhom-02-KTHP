package com.cutie_cuts_app.example.cutie_cuts_app.dto.barber;

import jakarta.validation.constraints.*;

public class BarberRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 100)
    private String name;

    @NotBlank(message = "Role is required")
    @Size(max = 100)
    private String role;

    @NotBlank(message = "Image is required")
    private String image;

    @NotNull(message = "Experience is required")
    @Min(value = 0, message = "Experience must be non-negative")
    private Integer experience;

    @NotBlank(message = "Specialties is required")
    private String specialties;

    @DecimalMin(value = "0.0", message = "Rating must be at least 0")
    @DecimalMax(value = "5.0", message = "Rating must be at most 5")
    private Double rating;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }
    public Integer getExperience() { return experience; }
    public void setExperience(Integer experience) { this.experience = experience; }
    public String getSpecialties() { return specialties; }
    public void setSpecialties(String specialties) { this.specialties = specialties; }
    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }
}
