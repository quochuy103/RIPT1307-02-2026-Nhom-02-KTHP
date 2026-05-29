package com.cutie_cuts_app.example.cutie_cuts_app.dto.domain;

public class CreateReviewRequest {

    private Long bookingId;
    private Long orderId;
    private Long productId;
    private Integer rating;
    private String comment;
    private ReviewSectionRequest overall;
    private ReviewSectionRequest barber;
    private ReviewSectionRequest service;

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public ReviewSectionRequest getOverall() {
        return overall;
    }

    public void setOverall(ReviewSectionRequest overall) {
        this.overall = overall;
    }

    public ReviewSectionRequest getBarber() {
        return barber;
    }

    public void setBarber(ReviewSectionRequest barber) {
        this.barber = barber;
    }

    public ReviewSectionRequest getService() {
        return service;
    }

    public void setService(ReviewSectionRequest service) {
        this.service = service;
    }
}
