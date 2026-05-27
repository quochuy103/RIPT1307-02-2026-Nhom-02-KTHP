package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.domain.CreateReviewRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Barber;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Booking;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.OrderItem;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Product;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Review;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.SalonService;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.ShopOrder;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.BarberRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.BookingRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ProductRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ReviewRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.SalonServiceRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ShopOrderRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.service.CurrentUserService;
import com.cutie_cuts_app.example.cutie_cuts_app.util.DomainStatusRules;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:5173"})
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final BarberRepository barberRepository;
    private final SalonServiceRepository serviceRepository;
    private final ProductRepository productRepository;
    private final ShopOrderRepository orderRepository;
    private final CurrentUserService currentUserService;

    public ReviewController(
            ReviewRepository reviewRepository,
            BookingRepository bookingRepository,
            BarberRepository barberRepository,
            SalonServiceRepository serviceRepository,
            ProductRepository productRepository,
            ShopOrderRepository orderRepository,
            CurrentUserService currentUserService) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.barberRepository = barberRepository;
        this.serviceRepository = serviceRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public List<Map<String, Object>> getAll() {
        return reviewRepository.findVisible().stream().map(this::toResponse).toList();
    }

    @GetMapping("/page")
    public Page<Map<String, Object>> getAllPaginated(@PageableDefault(size = 20) Pageable pageable,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long serviceId,
            @RequestParam(required = false) Long barberId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long orderId,
            @RequestParam(required = false) Integer minRating,
            @RequestParam(required = false) Integer maxRating,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdTo) {

        if (minRating != null && (minRating < 1 || minRating > 5)) {
            throw new ResponseStatusException(BAD_REQUEST, "minRating must be between 1 and 5");
        }
        if (maxRating != null && (maxRating < 1 || maxRating > 5)) {
            throw new ResponseStatusException(BAD_REQUEST, "maxRating must be between 1 and 5");
        }
        if (minRating != null && maxRating != null && minRating > maxRating) {
            throw new ResponseStatusException(BAD_REQUEST, "minRating must be <= maxRating");
        }

        LocalDateTime from = createdFrom != null ? createdFrom.atStartOfDay() : LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime to = createdTo != null ? createdTo.atTime(LocalTime.MAX) : LocalDateTime.of(2099, 12, 31, 23, 59);

        return reviewRepository.findAllFiltered(productId, serviceId, barberId, userId, orderId,
                minRating, maxRating, from, to, pageable).map(this::toResponse);
    }

    @GetMapping("/products/{productId}")
    public List<Map<String, Object>> getByProduct(@PathVariable Long productId) {
        return reviewRepository.findByProductIdAndDeletedFalse(productId).stream().map(this::toResponse).toList();
    }

    @GetMapping("/me")
    public List<Map<String, Object>> getMyReviews(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }
        User user = currentUserService.getByEmail(authentication.getName());
        return reviewRepository.findByUserAndDeletedFalse(user).stream().map(this::toResponse).toList();
    }

    @GetMapping("/me/reviewable-products")
    public List<Map<String, Object>> getMyReviewableProducts(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }

        User user = currentUserService.getByEmail(authentication.getName());
        return orderRepository.findByUser(user).stream()
                .filter(order -> isReviewableOrderStatus(order.getStatus()))
                .sorted(Comparator.comparing(ShopOrder::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .flatMap(order -> order.getItems().stream().map(item -> toReviewableProduct(order, item)))
                .filter(item -> !reviewRepository.existsByOrderIdAndProductId(
                        ((Number) item.get("orderId")).longValue(),
                        ((Number) item.get("productId")).longValue()))
                .toList();
    }

    @PostMapping
    @Transactional
    public Map<String, Object> create(@Valid @RequestBody CreateReviewRequest request, Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }

        User user = currentUserService.getByEmail(authentication.getName());
        Review review = new Review();
        review.setUser(user);
        review.setRating(request.getRating());
        review.setComment(request.getComment());

        boolean hasProductTarget = request.getOrderId() != null || request.getProductId() != null;
        boolean hasServiceTarget = request.getBookingId() != null
                || request.getBarberId() != null
                || request.getServiceId() != null;

        if (hasProductTarget && hasServiceTarget) {
            throw new ResponseStatusException(BAD_REQUEST, "Choose either product review or service review payload");
        }
        if (!hasProductTarget && !hasServiceTarget) {
            throw new ResponseStatusException(BAD_REQUEST, "Review target is required");
        }

        if (hasProductTarget) {
            attachProductReviewTarget(request, user, review);
        } else {
            attachServiceReviewTarget(request, user, review);
        }

        Review saved = reviewRepository.save(review);
        if (saved.getProduct() != null) {
            updateProductRating(saved.getProduct());
        }
        return toResponse(saved);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void delete(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }
        User user = currentUserService.getByEmail(authentication.getName());
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Review not found"));
        if (!review.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "You can only delete your own reviews");
        }

        Product product = review.getProduct();
        reviewRepository.deleteById(id);
        if (product != null) {
            updateProductRating(product);
        }
    }

    private void attachServiceReviewTarget(CreateReviewRequest request, User user, Review review) {
        if (request.getBookingId() != null) {
            Booking booking = bookingRepository.findById(request.getBookingId())
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Booking not found"));

            if (!booking.getUser().getId().equals(user.getId())) {
                throw new ResponseStatusException(FORBIDDEN, "You can only review your own bookings");
            }
            if (!"done".equals(booking.getStatus())) {
                throw new ResponseStatusException(BAD_REQUEST, "Cannot review a booking that is not completed");
            }
            if (reviewRepository.existsByBookingId(booking.getId())) {
                throw new ResponseStatusException(CONFLICT, "You have already reviewed this booking");
            }

            review.setBooking(booking);
        }
        if (request.getBarberId() != null) {
            Barber barber = barberRepository.findById(request.getBarberId())
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Barber not found"));
            review.setBarber(barber);
        }
        if (request.getServiceId() != null) {
            SalonService service = serviceRepository.findById(request.getServiceId())
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Service not found"));
            review.setService(service);
        }
    }

    private void attachProductReviewTarget(CreateReviewRequest request, User user, Review review) {
        if (request.getOrderId() == null || request.getProductId() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Both orderId and productId are required for product review");
        }

        ShopOrder order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));
        if (!order.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "You can only review products from your own orders");
        }
        if (!isReviewableOrderStatus(order.getStatus())) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Only shipped or delivered orders can be reviewed");
        }

        OrderItem matchingItem = order.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(request.getProductId()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Product is not part of this order"));

        if (reviewRepository.existsByOrderIdAndProductId(order.getId(), request.getProductId())) {
            throw new ResponseStatusException(CONFLICT, "You have already reviewed this product for this order");
        }

        review.setOrder(order);
        review.setProduct(matchingItem.getProduct());
    }

    private boolean isReviewableOrderStatus(String status) {
        String normalized = DomainStatusRules.normalizeCurrentStatus(status, "order");
        return "shipped".equals(normalized) || "delivered".equals(normalized);
    }

    private void updateProductRating(Product product) {
        Double average = reviewRepository.findAverageRatingByProductId(product.getId());
        product.setRating(average == null ? 4.5 : average);
        productRepository.save(product);
    }

    private Map<String, Object> toReviewableProduct(ShopOrder order, OrderItem item) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("orderId", order.getId());
        map.put("productId", item.getProduct().getId());
        map.put("productName", item.getProduct().getName());
        map.put("productImage", item.getProduct().getImage());
        map.put("quantity", item.getQuantity());
        map.put("price", item.getPrice());
        map.put("orderStatus", order.getStatus());
        map.put("orderedAt", formatDate(order.getCreatedAt()));
        return map;
    }

    private String formatDate(LocalDateTime value) {
        return value == null ? null : value.toLocalDate().toString();
    }

    private Map<String, Object> toResponse(Review review) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", review.getId());
        User user = review.getUser();
        Booking booking = review.getBooking();
        SalonService service = review.getService();
        Barber barber = review.getBarber();
        ShopOrder order = review.getOrder();
        Product product = review.getProduct();

        map.put("userId", user != null ? user.getId() : null);
        map.put("userName", user != null ? user.getName() : "Anonymous");
        map.put("rating", review.getRating());
        map.put("comment", review.getComment());
        map.put("date", formatDate(review.getCreatedAt()));
        map.put("bookingId", booking != null ? booking.getId() : null);
        map.put("serviceId", service != null ? service.getId() : null);
        map.put("barberId", barber != null ? barber.getId() : null);
        map.put("orderId", order != null ? order.getId() : null);
        map.put("productId", product != null ? product.getId() : null);
        map.put("productName", product != null ? product.getName() : null);
        map.put("reviewType", product != null ? "product" : "service");
        return map;
    }
}
