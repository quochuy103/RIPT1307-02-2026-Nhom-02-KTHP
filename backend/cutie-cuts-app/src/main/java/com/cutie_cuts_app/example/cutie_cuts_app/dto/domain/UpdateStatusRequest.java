package com.cutie_cuts_app.example.cutie_cuts_app.dto.domain;

import jakarta.validation.constraints.NotBlank;

public class UpdateStatusRequest {
    @NotBlank
    private String status;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
