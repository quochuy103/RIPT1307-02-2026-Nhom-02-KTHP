package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.Product;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ProductRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/products")
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:5173"})
public class ProductController {

    private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<Product> getAll() {
        return productRepository.findAll();
    }

    @PostMapping
    public Product create(@RequestBody Product body) {
        if (body.getRating() == null) {
            body.setRating(4.5);
        }
        if (body.getStock() == null) {
            body.setStock(0);
        }
        return productRepository.save(body);
    }

    @PutMapping("/{id}")
    public Product update(@PathVariable Long id, @RequestBody Product body) {
        Product existing = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Product not found"));

        existing.setName(body.getName());
        existing.setCategory(body.getCategory());
        existing.setDescription(body.getDescription());
        existing.setImage(body.getImage());
        existing.setPrice(body.getPrice());
        if (body.getRating() != null) {
            existing.setRating(body.getRating());
        }
        if (body.getStock() != null) {
            existing.setStock(body.getStock());
        }

        return productRepository.save(existing);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResponseStatusException(NOT_FOUND, "Product not found");
        }
        productRepository.deleteById(id);
    }
}
