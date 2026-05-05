package com.cutie_cuts_app.example.cutie_cuts_app.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class SlotAlreadyBookedException extends ResponseStatusException {
    public SlotAlreadyBookedException() {
        super(HttpStatus.CONFLICT, "Barber already booked at this time");
    }
}
