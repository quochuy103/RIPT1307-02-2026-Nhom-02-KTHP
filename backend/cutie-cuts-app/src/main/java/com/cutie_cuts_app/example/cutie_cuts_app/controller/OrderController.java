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
import com.cutie_cuts_app.example.cutie_cuts_app.util.NotificationType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/orders")
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:5173"})
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
    public List<Map<String, Object>> getAll() {
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
    public Map<String, Object> create(@RequestBody CreateOrderRequest request, Authentication authentication) {
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
    public Map<String, Object> updateStatus(@PathVariable Long id, @RequestBody UpdateStatusRequest request) {
        ShopOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));
        order.setStatus(request.getStatus());
        ShopOrder saved = orderRepository.save(order);
        notificationService.notify(order.getUser(), NotificationType.ORDER_STATUS_UPDATED,
                "Order status updated to: " + request.getStatus(),
                "order", saved.getId());
        return toResponse(saved);
    }

    private Map<String, Object> toResponse(ShopOrder order) {
        List<Map<String, Object>> products = order.getItems().stream().map(item -> {
            Map<String, Object> p = new LinkedHashMap<>();
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
        map.put("status", order.getStatus());
        map.put("createdAt", String.valueOf(order.getCreatedAt()).substring(0, 10));
        return map;
    }
}
