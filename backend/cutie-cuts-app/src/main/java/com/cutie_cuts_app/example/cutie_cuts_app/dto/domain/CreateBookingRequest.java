package com.cutie_cuts_app.example.cutie_cuts_app.dto.domain;

import java.time.LocalDate;

public class CreateBookingRequest {
    private Long serviceId;
    private Long barberId;
    private LocalDate date;
    private String time;

    public Long getServiceId() { return serviceId; }
    public void setServiceId(Long serviceId) { this.serviceId = serviceId; }
    public Long getBarberId() { return barberId; }
    public void setBarberId(Long barberId) { this.barberId = barberId; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }
}
