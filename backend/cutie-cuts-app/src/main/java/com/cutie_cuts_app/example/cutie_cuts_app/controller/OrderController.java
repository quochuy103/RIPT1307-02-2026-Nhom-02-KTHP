package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.domain.CreateOrderRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.domain.UpdateStatusRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.OrderItem;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Product;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.ShopOrder;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.UserAddress;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ProductRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ShopOrderRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserAddressRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.service.CurrentUserService;
import com.cutie_cuts_app.example.cutie_cuts_app.service.NotificationService;
import com.cutie_cuts_app.example.cutie_cuts_app.util.DomainStatusRules;
import com.cutie_cuts_app.example.cutie_cuts_app.util.NotificationType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = { "http://localhost:8080", "http://localhost:5173" })
@Tag(name = "Order", description = "Order management APIs")
public class OrderController {

    private final ShopOrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CurrentUserService currentUserService;
    private final NotificationService notificationService;
    private final UserAddressRepository userAddressRepository;

    public OrderController(
            ShopOrderRepository orderRepository,
            ProductRepository productRepository,
            CurrentUserService currentUserService,
            NotificationService notificationService,
            UserAddressRepository userAddressRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.currentUserService = currentUserService;
        this.notificationService = notificationService;
        this.userAddressRepository = userAddressRepository;
    }

    @GetMapping
    @Operation(summary = "Get all orders", description = "Returns all orders. Admin access only.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Orders retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Only admins can view all orders")
    })
    public List<Map<String, Object>> getAll(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }
        if (!isAdmin(authentication)) {
            throw new ResponseStatusException(FORBIDDEN, "Only admins can view all orders");
        }
        return orderRepository.findAll().stream().map(this::toResponse).toList();
    }

    @GetMapping("/page")
    public Page<Map<String, Object>> getAllPaginated(@PageableDefault(size = 20) Pageable pageable,
            Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }
        if (!isAdmin(authentication)) {
            throw new ResponseStatusException(FORBIDDEN, "Only admins can view all orders");
        }
        return orderRepository.findAll(pageable).map(this::toResponse);
    }

    @GetMapping("/my")
    @Operation(summary = "Get current user's orders", description = "Returns the authenticated user's orders.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Orders retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public List<Map<String, Object>> myOrders(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }
        User user = currentUserService.getByEmail(authentication.getName());
        return orderRepository.findByUser(user).stream().map(this::toResponse).toList();
    }

    @GetMapping("/my/page")
    @Operation(summary = "Get current user's orders (paginated)", description = "Returns the authenticated user's orders sorted by creation date descending, with pagination.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Orders retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public Page<Map<String, Object>> myOrdersPaged(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }
        User user = currentUserService.getByEmail(authentication.getName());
        return orderRepository.findByUser(user, pageable).map(this::toResponse);
    }

    @PostMapping
    @Transactional
    @Operation(summary = "Create order", description = "Creates a new order for the authenticated user and deducts stock from ordered products.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Order created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid order payload or quantity"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "404", description = "Product not found"),
            @ApiResponse(responseCode = "409", description = "Insufficient stock for one or more products")
    })
    public Map<String, Object> create(@Valid @RequestBody CreateOrderRequest request, Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Order items are required");
        }

        User user = currentUserService.getByEmail(authentication.getName());
        String resolvedAddress = resolveOrderAddress(user, request);

        ShopOrder order = new ShopOrder();
        order.setUser(user);
        order.setAddress(resolvedAddress);

        List<OrderItem> items = new ArrayList<>();
        double total = 0;

        for (CreateOrderRequest.CreateOrderItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Product not found"));

            int qty = itemRequest.getQuantity() == null ? 0 : itemRequest.getQuantity();
            if (qty <= 0) {
                throw new ResponseStatusException(BAD_REQUEST, "Quantity must be greater than 0");
            }

            int updated = productRepository.deductStock(product.getId(), qty);
            if (updated == 0) {
                throw new ResponseStatusException(CONFLICT, "Not enough stock for: " + product.getName());
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
    @Operation(summary = "Update order status", description = "Updates an order status using the domain status rules. Admin access only.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Order status updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid status value"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "Only admins can update order status"),
            @ApiResponse(responseCode = "404", description = "Order not found")
    })
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
    @Operation(summary = "Confirm order received", description = "Marks the authenticated user's shipped order as delivered.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Order marked as received"),
            @ApiResponse(responseCode = "400", description = "Order is not eligible to be confirmed as received"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "You can only confirm your own orders"),
            @ApiResponse(responseCode = "404", description = "Order not found")
    })
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
    @Operation(summary = "Cancel order", description = "Cancels a pending order and restores stock. Customers can cancel their own orders; admins can cancel any order.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Order cancelled successfully"),
            @ApiResponse(responseCode = "400", description = "Order cannot be cancelled in its current status"),
            @ApiResponse(responseCode = "401", description = "Authentication required"),
            @ApiResponse(responseCode = "403", description = "You can only cancel your own orders"),
            @ApiResponse(responseCode = "404", description = "Order not found")
    })
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

    private String resolveOrderAddress(User user, CreateOrderRequest request) {
        if (request.getAddressId() != null) {
            UserAddress userAddress = userAddressRepository
                    .findByIdAndUserIdAndDeletedFalse(request.getAddressId(), user.getId())
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Address not found"));
            return formatAddressSnapshot(userAddress);
        }

        if (request.getAddress() == null || request.getAddress().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Address is required");
        }

        return request.getAddress().trim();
    }

    private String formatAddressSnapshot(UserAddress a) {
        StringBuilder sb = new StringBuilder();

        boolean hasRecipient = a.getRecipientName() != null && !a.getRecipientName().isBlank();
        boolean hasPhone = a.getPhone() != null && !a.getPhone().isBlank();

        if (hasRecipient) {
            sb.append(a.getRecipientName().trim());
            if (hasPhone) {
                sb.append(" - ").append(a.getPhone().trim());
            }
            sb.append(" - ");
        } else if (hasPhone) {
            sb.append(a.getPhone().trim()).append(" - ");
        }

        sb.append(a.getAddressLine().trim());

        String ward = a.getWard();
        String district = a.getDistrict();
        if (ward != null && !ward.isBlank()) sb.append(", ").append(ward.trim());
        if (district != null && !district.isBlank()) sb.append(", ").append(district.trim());
        sb.append(", ").append(a.getCity().trim());

        String note = a.getNote();
        if (note != null && !note.isBlank()) {
            sb.append(". Note: ").append(note.trim());
        }

        return sb.toString();
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
