package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.product.ProductRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.product.ProductResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Product;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ImageStorageService imageStorageService;
    private final PresignService presignService;
    private final S3StorageService s3StorageService;

    public ProductService(ProductRepository productRepository, ImageStorageService imageStorageService,
                          PresignService presignService, S3StorageService s3StorageService) {
        this.productRepository = productRepository;
        this.imageStorageService = imageStorageService;
        this.presignService = presignService;
        this.s3StorageService = s3StorageService;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> findAll() {
        return productRepository.findByDeletedFalse().stream()
                .map(ProductResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> findAllPaginated(Pageable pageable) {
        return productRepository.findAll(pageable).map(ProductResponse::from);
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
        String resolvedImage = resolveProductImage(request);
        if (resolvedImage == null || resolvedImage.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Image is required: provide objectKey (presigned upload) or image URL");
        }
        product.setImage(resolvedImage);
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
        String oldImage = product.getImage();
        product.setName(request.getName());
        product.setPrice(request.getPrice());
        String newImage = resolveProductImage(request);
        product.setImage(newImage);
        if (request.getRating() != null) {
            product.setRating(request.getRating());
        }
        product.setCategory(request.getCategory());
        product.setDescription(request.getDescription());
        product.setStock(request.getStock());
        Product saved = productRepository.save(product);

        if (oldImage != null && !oldImage.isBlank() && !oldImage.equals(newImage)
                && ImageStorageService.isManagedUrl(oldImage)) {
            imageStorageService.deleteImage(oldImage);
        }

        return ProductResponse.from(saved);
    }

    @Transactional
    public void delete(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
        imageStorageService.deleteImage(product.getImage());
        product.setDeleted(true);
        product.setDeletedAt(java.time.LocalDateTime.now());
    }

    private String resolveProductImage(ProductRequest request) {
        if (request.getObjectKey() != null && !request.getObjectKey().isBlank()) {
            presignService.validateObjectKeyForContext("PRODUCT", request.getObjectKey());

            if (request.getContentType() != null && !PresignService.ALLOWED_CONTENT_TYPES.contains(request.getContentType())) {
                throw new ResponseStatusException(BAD_REQUEST,
                        "Unsupported content type. Allowed: image/jpeg, image/png, image/webp, image/gif");
            }
            if (request.getFileSize() != null && (request.getFileSize() <= 0 || request.getFileSize() > PresignService.MAX_IMAGE_SIZE)) {
                throw new ResponseStatusException(BAD_REQUEST,
                        "File size must be between 1 byte and 5 MB");
            }

            String bucket = presignService.bucketForContext("PRODUCT");
            if (!s3StorageService.objectExists(bucket, request.getObjectKey())) {
                throw new ResponseStatusException(BAD_REQUEST, "Uploaded object not found in storage");
            }

            return presignService.derivePublicUrl("PRODUCT", request.getObjectKey());
        }

        // Legacy: manual URL or data URL — backward compat, not part of presigned upload security model
        return request.getImage();
    }

    public static class ProductNotFoundException extends ResponseStatusException {
        public ProductNotFoundException(Long id) {
            super(HttpStatus.NOT_FOUND, "Product not found: id=" + id);
        }
    }
}