package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.product.ProductRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.product.ProductResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Product;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> findAll() {
        return productRepository.findByDeletedFalse().stream()
                .map(ProductResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductResponse findById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
        return ProductResponse.from(product);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> findByCategory(String category) {
        return productRepository.findByCategoryIgnoreCase(category).stream()
                .map(ProductResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> search(String name) {
        return productRepository.findByNameContainingIgnoreCase(name).stream()
                .map(ProductResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public boolean existsById(Long id) {
        return productRepository.existsById(id);
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        Product product = new Product();
        product.setName(request.getName());
        product.setPrice(request.getPrice());
        product.setImage(request.getImage());
        product.setRating(request.getRating() != null ? request.getRating() : 4.5);
        product.setCategory(request.getCategory());
        product.setDescription(request.getDescription());
        product.setStock(request.getStock() != null ? request.getStock() : 0);
        Product saved = productRepository.save(product);
        return ProductResponse.from(saved);
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
        product.setName(request.getName());
        product.setPrice(request.getPrice());
        product.setImage(request.getImage());
        if (request.getRating() != null) {
            product.setRating(request.getRating());
        }
        product.setCategory(request.getCategory());
        product.setDescription(request.getDescription());
        product.setStock(request.getStock());
        Product saved = productRepository.save(product);
        return ProductResponse.from(saved);
    }

    @Transactional
    public void delete(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
        product.setDeleted(true);
        product.setDeletedAt(java.time.LocalDateTime.now());
    }

    public static class ProductNotFoundException extends ResponseStatusException {
        public ProductNotFoundException(Long id) {
            super(HttpStatus.NOT_FOUND, "Product not found: id=" + id);
        }
    }
}