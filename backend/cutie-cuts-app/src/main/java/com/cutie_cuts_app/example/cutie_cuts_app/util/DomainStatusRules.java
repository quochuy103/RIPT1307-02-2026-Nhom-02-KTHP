package com.cutie_cuts_app.example.cutie_cuts_app.util;

import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Set;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

public final class DomainStatusRules {

    private static final Set<String> BOOKING_UPDATE_STATUSES = Set.of("pending", "confirmed", "done");
    private static final Set<String> ORDER_PUBLIC_UPDATE_STATUSES = Set.of("pending", "paid", "shipping", "shipped");

    private DomainStatusRules() {
    }

    public static String normalizeBookingStatusForUpdate(String status) {
        return normalizeAllowedStatus(status, BOOKING_UPDATE_STATUSES, "booking");
    }

    public static String normalizeOrderStatusForUpdate(String status) {
        String normalizedStatus = normalizeCurrentStatus(status, "order");
        return switch (normalizedStatus) {
            case "pending", "paid", "shipping" -> normalizedStatus;
            case "shipped", "delivered" -> "delivered";
            default -> throw new ResponseStatusException(BAD_REQUEST,
                    "Invalid order status. Allowed values: " + String.join(", ", ORDER_PUBLIC_UPDATE_STATUSES));
        };
    }

    public static String normalizeOrderStatusForResponse(String status) {
        String normalizedStatus = normalizeCurrentStatus(status, "order");
        return switch (normalizedStatus) {
            case "delivered" -> "shipped";
            case "shipped" -> "shipping";
            default -> normalizedStatus;
        };
    }

    public static String normalizeCurrentStatus(String status, String domainName) {
        if (status == null || status.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, domainName + " has an invalid status");
        }
        return status.trim().toLowerCase(Locale.ROOT);
    }

    public static void ensureBookingCanBeCancelled(String currentStatus) {
        switch (currentStatus) {
            case "pending", "confirmed" -> {
                return;
            }
            case "cancelled" -> throw new ResponseStatusException(BAD_REQUEST, "Booking is already cancelled");
            case "done" -> throw new ResponseStatusException(BAD_REQUEST, "Cannot cancel a booking that is done");
            default -> throw new ResponseStatusException(BAD_REQUEST,
                    "Cannot cancel a booking that is " + currentStatus);
        }
    }

    public static void ensureOrderCanBeCancelled(String currentStatus) {
        switch (currentStatus) {
            case "pending" -> {
                return;
            }
            case "cancelled" -> throw new ResponseStatusException(BAD_REQUEST, "Order is already cancelled");
            case "paid", "shipping", "shipped", "delivered" -> throw new ResponseStatusException(BAD_REQUEST,
                    "Cannot cancel an order that has been " + currentStatus);
            default -> throw new ResponseStatusException(BAD_REQUEST,
                    "Cannot cancel an order that is " + currentStatus);
        }
    }

    private static String normalizeAllowedStatus(String status, Set<String> allowedStatuses, String domainName) {
        String normalizedStatus = normalizeCurrentStatus(status, domainName);
        if (!allowedStatuses.contains(normalizedStatus)) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Invalid " + domainName + " status. Allowed values: " + String.join(", ", allowedStatuses));
        }
        return normalizedStatus;
    }
}
