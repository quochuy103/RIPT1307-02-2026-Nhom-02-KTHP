package com.cutie_cuts_app.example.cutie_cuts_app.dto.user;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class UserBookingHistoryResponse {

    private final Long id;
    private final String status;
    private final Long serviceId;
    private final String serviceName;
    private final Long barberId;
    private final String barberName;
    private final double price;
    private final LocalDate date;
    private final LocalTime time;
    private final LocalDateTime createdAt;
    private final boolean reviewEligible;
    private final boolean reviewSubmitted;
    private final Long reviewId;
    private final Integer overallRating;

    public UserBookingHistoryResponse(
            Long id,
            String status,
            Long serviceId,
            String serviceName,
            Long barberId,
            String barberName,
            double price,
            LocalDate date,
            LocalTime time,
            LocalDateTime createdAt,
            boolean reviewEligible,
            boolean reviewSubmitted,
            Long reviewId,
            Integer overallRating) {
        this.id = id;
        this.status = status;
        this.serviceId = serviceId;
        this.serviceName = serviceName;
        this.barberId = barberId;
        this.barberName = barberName;
        this.price = price;
        this.date = date;
        this.time = time;
        this.createdAt = createdAt;
        this.reviewEligible = reviewEligible;
        this.reviewSubmitted = reviewSubmitted;
        this.reviewId = reviewId;
        this.overallRating = overallRating;
    }

    public Long getId() {
        return id;
    }

    public String getStatus() {
        return status;
    }

    public Long getServiceId() {
        return serviceId;
    }

    public String getServiceName() {
        return serviceName;
    }

    public Long getBarberId() {
        return barberId;
    }

    public String getBarberName() {
        return barberName;
    }

    public double getPrice() {
        return price;
    }

    public LocalDate getDate() {
        return date;
    }

    public LocalTime getTime() {
        return time;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public boolean isReviewEligible() {
        return reviewEligible;
    }

    public boolean isReviewSubmitted() {
        return reviewSubmitted;
    }

    public Long getReviewId() {
        return reviewId;
    }

    public Integer getOverallRating() {
        return overallRating;
    }
}
