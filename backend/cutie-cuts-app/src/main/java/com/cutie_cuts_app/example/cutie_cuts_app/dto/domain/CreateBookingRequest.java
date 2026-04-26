package com.cutie_cuts_app.example.cutie_cuts_app.dto.domain;

import java.time.LocalDate;
import java.time.LocalTime;

public class CreateBookingRequest {
    private Long serviceId;
    private Long barberId;
    private LocalDate date;
    private LocalTime time;

    public Long getServiceId() { return serviceId; }
    public void setServiceId(Long serviceId) { this.serviceId = serviceId; }
    public Long getBarberId() { return barberId; }
    public void setBarberId(Long barberId) { this.barberId = barberId; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public LocalTime getTime() { return time; }
    public void setTime(LocalTime time) { this.time = time; }
}
