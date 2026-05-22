package com.cutie_cuts_app.example.cutie_cuts_app.dto.user;

import java.time.LocalDateTime;
import java.util.List;

public class UserOrderHistoryResponse {

    private final Long id;
    private final String status;
    private final double totalPrice;
    private final String address;
    private final LocalDateTime createdAt;
    private final List<ProductItem> products;

    public UserOrderHistoryResponse(
            Long id,
            String status,
            double totalPrice,
            String address,
            LocalDateTime createdAt,
            List<ProductItem> products) {
        this.id = id;
        this.status = status;
        this.totalPrice = totalPrice;
        this.address = address;
        this.createdAt = createdAt;
        this.products = products;
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

    public List<ProductItem> getProducts() {
        return products;
    }

    public static class ProductItem {

        private final Long productId;
        private final String name;
        private final int quantity;
        private final double price;

        public ProductItem(Long productId, String name, int quantity, double price) {
            this.productId = productId;
            this.name = name;
            this.quantity = quantity;
            this.price = price;
        }

        public Long getProductId() {
            return productId;
        }

        public String getName() {
            return name;
        }

        public int getQuantity() {
            return quantity;
        }

        public double getPrice() {
            return price;
        }
    }
}
