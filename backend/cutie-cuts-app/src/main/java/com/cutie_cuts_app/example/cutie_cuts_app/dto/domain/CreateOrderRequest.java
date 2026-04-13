package com.cutie_cuts_app.example.cutie_cuts_app.dto.domain;

import java.util.List;

public class CreateOrderRequest {
    private String address;
    private List<CreateOrderItemRequest> items;

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public List<CreateOrderItemRequest> getItems() { return items; }
    public void setItems(List<CreateOrderItemRequest> items) { this.items = items; }

    public static class CreateOrderItemRequest {
        private Long productId;
        private Integer quantity;

        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }
}
