package com.cutie_cuts_app.example.cutie_cuts_app.dto.domain;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

@Schema(description = "Request body for creating a new booking")
public class CreateBookingRequest {
    @NotNull
    @Schema(type = "integer", format = "int64", example = "2", description = "ID of the service to book")
    private Long serviceId;

    @NotNull
    @Schema(type = "integer", format = "int64", example = "1", description = "ID of the barber")
    private Long barberId;

    @NotNull
    @Schema(type = "string", format = "date", example = "2026-05-20", description = "Booking date in ISO format YYYY-MM-DD")
    private LocalDate date;

    @NotNull
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm[:ss]")
    @Schema(
            implementation = String.class,
            type = "string",
            format = "time",
            example = "10:00",
            description = "Booking time in 24-hour format. Use HH:mm or HH:mm:ss. Example: 10:00")
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
