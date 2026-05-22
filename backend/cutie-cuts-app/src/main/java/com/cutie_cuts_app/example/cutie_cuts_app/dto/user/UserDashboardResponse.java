package com.cutie_cuts_app.example.cutie_cuts_app.dto.user;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class UserDashboardResponse {

    private final int profileCompletionPercent;
    private final long totalOrders;
    private final long completedOrders;
    private final long totalBookings;
    private final long completedBookings;
    private final double totalSpent;
    private final double productSpent;
    private final double serviceSpent;
    private final OrderSummary latestOrder;
    private final BookingSummary latestBooking;

    public UserDashboardResponse(
            int profileCompletionPercent,
            long totalOrders,
            long completedOrders,
            long totalBookings,
            long completedBookings,
            double totalSpent,
            double productSpent,
            double serviceSpent,
            OrderSummary latestOrder,
            BookingSummary latestBooking) {
        this.profileCompletionPercent = profileCompletionPercent;
        this.totalOrders = totalOrders;
        this.completedOrders = completedOrders;
        this.totalBookings = totalBookings;
        this.completedBookings = completedBookings;
        this.totalSpent = totalSpent;
        this.productSpent = productSpent;
        this.serviceSpent = serviceSpent;
        this.latestOrder = latestOrder;
        this.latestBooking = latestBooking;
    }

    public int getProfileCompletionPercent() {
        return profileCompletionPercent;
    }

    public long getTotalOrders() {
        return totalOrders;
    }

    public long getCompletedOrders() {
        return completedOrders;
    }

    public long getTotalBookings() {
        return totalBookings;
    }

    public long getCompletedBookings() {
        return completedBookings;
    }

    public double getTotalSpent() {
        return totalSpent;
    }

    public double getProductSpent() {
        return productSpent;
    }

    public double getServiceSpent() {
        return serviceSpent;
    }

    public OrderSummary getLatestOrder() {
        return latestOrder;
    }

    public BookingSummary getLatestBooking() {
        return latestBooking;
    }

    public static class OrderSummary {

        private final Long id;
        private final String status;
        private final double totalPrice;
        private final String address;
        private final LocalDateTime createdAt;

        public OrderSummary(Long id, String status, double totalPrice, String address, LocalDateTime createdAt) {
            this.id = id;
            this.status = status;
            this.totalPrice = totalPrice;
            this.address = address;
            this.createdAt = createdAt;
        }

        public Long getId() {
            return id;
        }

        public String getStatus() {
            return status;
        }

        public double getTotalPrice() {
            return totalPrice;
        }

        public String getAddress() {
            return address;
        }

        public LocalDateTime getCreatedAt() {
            return createdAt;
        }
    }

    public static class BookingSummary {

        private final Long id;
        private final String status;
        private final String serviceName;
        private final String barberName;
        private final double price;
        private final LocalDate date;
        private final LocalTime time;
        private final LocalDateTime createdAt;

        public BookingSummary(
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
}
