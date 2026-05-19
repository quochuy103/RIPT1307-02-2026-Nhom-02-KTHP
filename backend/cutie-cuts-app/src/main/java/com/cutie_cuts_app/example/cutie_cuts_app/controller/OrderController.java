package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.domain.CreateOrderRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.domain.UpdateStatusRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.OrderItem;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Product;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.ShopOrder;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ProductRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ShopOrderRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.service.CurrentUserService;
import com.cutie_cuts_app.example.cutie_cuts_app.service.NotificationService;
import com.cutie_cuts_app.example.cutie_cuts_app.util.DomainStatusRules;
import com.cutie_cuts_app.example.cutie_cuts_app.util.NotificationType;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = { "http://localhost:8080", "http://localhost:5173" })
public class OrderController {

    private final ShopOrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CurrentUserService currentUserService;
    private final NotificationService notificationService;

    public OrderController(
            ShopOrderRepository orderRepository,
            ProductRepository productRepository,
            CurrentUserService currentUserService,
            NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.currentUserService = currentUserService;
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<Map<String, Object>> getAll(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }
        if (!isAdmin(authentication)) {
            throw new ResponseStatusException(FORBIDDEN, "Only admins can view all orders");
        }
        return orderRepository.findAll().stream().map(this::toResponse).toList();
    }

    @GetMapping("/my")
    public List<Map<String, Object>> myOrders(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }
        User user = currentUserService.getByEmail(authentication.getName());
        return orderRepository.findByUser(user).stream().map(this::toResponse).toList();
    }

    @PostMapping
    @Transactional
    public Map<String, Object> create(@Valid @RequestBody CreateOrderRequest request, Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Order items are required");
        }

        User user = currentUserService.getByEmail(authentication.getName());

        ShopOrder order = new ShopOrder();
        order.setUser(user);
        order.setAddress(request.getAddress());

        List<OrderItem> items = new ArrayList<>();
        double total = 0;

        for (CreateOrderRequest.CreateOrderItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Product not found"));

            int qty = itemRequest.getQuantity() == null ? 0 : itemRequest.getQuantity();
            if (qty <= 0) {
                throw new ResponseStatusException(BAD_REQUEST, "Quantity must be greater than 0");
            }
            if (qty > product.getStock()) {
                throw new ResponseStatusException(BAD_REQUEST, "Not enough stock for: " + product.getName());
            }

            // Deduct stock
            product.setStock(product.getStock() - qty);
            productRepository.save(product);

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setQuantity(qty);
            item.setPrice(product.getPrice());
            items.add(item);

            total += product.getPrice() * qty;
        }

        order.setItems(items);
        order.setTotalPrice(total);

        ShopOrder saved = orderRepository.save(order);
        notificationService.notify(user, NotificationType.ORDER_PLACED,
                "Order placed for $" + String.format("%.2f", total),
                "order", saved.getId());
        return toResponse(saved);
    }

    @PatchMapping("/{id}/status")
    public Map<String, Object> updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateStatusRequest request,
            Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }
        if (!isAdmin(authentication)) {
            throw new ResponseStatusException(FORBIDDEN, "Only admins can update order status");
        }

        ShopOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));

        String newStatus = request.getStatus();
        if (!List.of("pending", "paid", "cancelled", "shipped", "delivered").contains(newStatus)) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid status. Allowed: pending, paid, cancelled, shipped, delivered");
        }
        order.setStatus(newStatus);



        String normalizedStatus = DomainStatusRules.normalizeOrderStatusForUpdate(request.getStatus());
        order.setStatus(normalizedStatus);

        ShopOrder saved = orderRepository.save(order);
        String responseStatus = DomainStatusRules.normalizeOrderStatusForResponse(saved.getStatus());
        notificationService.notify(order.getUser(), NotificationType.ORDER_STATUS_UPDATED,
                "Order status updated to: " + responseStatus,
                "order", saved.getId());
        return toResponse(saved);
    }

    @PostMapping("/{id}/confirm-received")
    @Transactional
    public Map<String, Object> confirmReceived(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }

        User user = currentUserService.getByEmail(authentication.getName());
        ShopOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));
        if (!order.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "You can only confirm receipt for your own orders");
        }

        String currentStatus = DomainStatusRules.normalizeCurrentStatus(order.getStatus(), "Order");
        DomainStatusRules.ensureOrderCanBeConfirmedReceived(currentStatus);

        order.setStatus("delivered");
        ShopOrder saved = orderRepository.save(order);
        notificationService.notify(order.getUser(), NotificationType.ORDER_STATUS_UPDATED,
                "Order marked as received.",
                "order", saved.getId());
        return toResponse(saved);
    }

    @PostMapping("/{id}/cancel")
    @Transactional
    public Map<String, Object> cancel(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }
        boolean isAdmin = isAdmin(authentication);
        User user = currentUserService.getByEmail(authentication.getName());
        ShopOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));
        if (!isAdmin && !order.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "You can only cancel your own orders");
        }
        String currentStatus = DomainStatusRules.normalizeCurrentStatus(order.getStatus(), "Order");
        DomainStatusRules.ensureOrderCanBeCancelled(currentStatus);

        // Restore stock for each item
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setStock(product.getStock() + item.getQuantity());
            productRepository.save(product);
        }

        order.setStatus("cancelled");
        ShopOrder saved = orderRepository.save(order);
        notificationService.notify(order.getUser(), NotificationType.ORDER_STATUS_UPDATED,
                "Order cancelled. Stock restored.",
                "order", saved.getId());
        return toResponse(saved);
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private Map<String, Object> toResponse(ShopOrder order) {
        List<Map<String, Object>> products = order.getItems().stream().map(item -> {
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("productId", item.getProduct().getId());
            p.put("name", item.getProduct().getName());
            p.put("qty", item.getQuantity());
            p.put("price", item.getPrice());
            return p;
        }).toList();

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", order.getId());
        map.put("userId", order.getUser().getId());
        map.put("customerName", order.getUser().getName());
        map.put("products", products);
        map.put("totalPrice", order.getTotalPrice());
        map.put("address", order.getAddress());
        map.put("status", DomainStatusRules.normalizeOrderStatusForResponse(order.getStatus()));
        map.put("createdAt", String.valueOf(order.getCreatedAt()).substring(0, 10));
        return map;
    }
}
