package com.cutie_cuts_app.example.cutie_cuts_app.dto.user;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class UserBookingHistoryResponse {

    private final Long id;
    private final String status;
    private final String serviceName;
    private final String barberName;
    private final double price;
    private final LocalDate date;
    private final LocalTime time;
    private final LocalDateTime createdAt;

    public UserBookingHistoryResponse(
            Long id,
            String status,
            String serviceName,
            String barberName,
            double price,
            LocalDate date,
            LocalTime time,
            LocalDateTime createdAt) {
        this.id = id;
        this.status = status;
        this.serviceName = serviceName;
        this.barberName = barberName;
        this.price = price;
        this.date = date;
        this.time = time;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getStatus() {
        return status;
    }

    public String getServiceName() {
        return serviceName;
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
}
