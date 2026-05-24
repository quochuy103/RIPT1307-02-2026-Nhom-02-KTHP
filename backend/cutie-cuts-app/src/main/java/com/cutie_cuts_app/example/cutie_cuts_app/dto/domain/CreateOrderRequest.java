package com.cutie_cuts_app.example.cutie_cuts_app.dto.domain;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class CreateOrderRequest {
    @NotBlank(message = "Address is required")
    private String address;

    @Valid
    private List<CreateOrderItemRequest> items;

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public List<CreateOrderItemRequest> getItems() { return items; }
    public void setItems(List<CreateOrderItemRequest> items) { this.items = items; }

    public static class CreateOrderItemRequest {
        @NotNull(message = "Product ID is required")
        private Long productId;

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        private Integer quantity;

        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }
}
