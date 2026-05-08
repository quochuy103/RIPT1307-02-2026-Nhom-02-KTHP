package com.cutie_cuts_app.example.cutie_cuts_app.dto.review;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.Review;
import java.time.LocalDateTime;

public class ReviewResponse {
    private Long id;
    private Long userId;
    private String userName;
    private Integer rating;
    private String comment;
    private Long bookingId;
    private Long serviceId;
    private Long barberId;
    private LocalDateTime createdAt;
    private Double averageRating;

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getUserName() { return userName; }
    public Integer getRating() { return rating; }
    public String getComment() { return comment; }
    public Long getBookingId() { return bookingId; }
    public Long getServiceId() { return serviceId; }
    public Long getBarberId() { return barberId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }

    public static ReviewResponse from(Review review) {
        ReviewResponse response = new ReviewResponse();
        response.id = review.getId();
        response.userId = review.getUser().getId();
        response.userName = review.getUser().getName();
        response.rating = review.getRating();
        response.comment = review.getComment();
        response.bookingId = review.getBooking() != null ? review.getBooking().getId() : null;
        response.serviceId = review.getService() != null ? review.getService().getId() : null;
        response.barberId = review.getBarber() != null ? review.getBarber().getId() : null;
        response.createdAt = review.getCreatedAt();
        return response;
    }
}