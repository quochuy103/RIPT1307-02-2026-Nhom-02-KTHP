package com.cutie_cuts_app.example.cutie_cuts_app.dto.product;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.Product;
import java.time.LocalDateTime;

public class ProductResponse {

    private final Long id;
    private final String name;
    private final Double price;
    private final String image;
    private final Double rating;
    private final String category;
    private final String description;
    private final Integer stock;
    private final LocalDateTime createdAt;

    public ProductResponse(Long id, String name, Double price, String image,
                           Double rating, String category, String description,
                           Integer stock, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.image = image;
        this.rating = rating;
        this.category = category;
        this.description = description;
        this.stock = stock;
        this.createdAt = createdAt;
    }

    public static ProductResponse from(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getPrice(),
                product.getImage(),
                product.getRating(),
                product.getCategory(),
                product.getDescription(),
                product.getStock(),
                product.getCreatedAt()
        );
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public Double getPrice() { return price; }
    public String getImage() { return image; }
    public Double getRating() { return rating; }
    public String getCategory() { return category; }
    public String getDescription() { return description; }
    public Integer getStock() { return stock; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}