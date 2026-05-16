package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.domain.UpdateStatusRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.OrderItem;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Product;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.ShopOrder;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ProductRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ShopOrderRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.service.CurrentUserService;
import com.cutie_cuts_app.example.cutie_cuts_app.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;

@ExtendWith(MockitoExtension.class)
class OrderControllerTest {

    @Mock
    private ShopOrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private NotificationService notificationService;

    private OrderController orderController;

    @BeforeEach
    void setUp() {
        orderController = new OrderController(
                orderRepository,
                productRepository,
                currentUserService,
                notificationService);
    }

    @Test
    void updateStatusRejectsNonAdminUsers() {
        UpdateStatusRequest request = new UpdateStatusRequest();
        request.setStatus("shipped");
        Authentication authentication = userAuthentication();

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> orderController.updateStatus(1L, request, authentication));

        assertEquals(FORBIDDEN, exception.getStatusCode());
        verify(orderRepository, never()).findById(any());
    }

    @Test
    void updateStatusAcceptsShippingForAdmin() {
        User owner = createUser(10L, "Customer");
        ShopOrder order = createOrder(1L, owner, "paid", 2);
        UpdateStatusRequest request = new UpdateStatusRequest();
        request.setStatus("shipping");
        Authentication authentication = adminAuthentication();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        Map<String, Object> response = orderController.updateStatus(1L, request, authentication);

        assertEquals("shipping", order.getStatus());
        assertEquals("shipping", response.get("status"));
        verify(orderRepository).save(order);
    }

    @Test
    void updateStatusMapsShippedToDeliveredInternallyForAdmin() {
        User owner = createUser(10L, "Customer");
        ShopOrder order = createOrder(1L, owner, "shipping", 2);
        UpdateStatusRequest request = new UpdateStatusRequest();
        request.setStatus("shipped");
        Authentication authentication = adminAuthentication();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        Map<String, Object> response = orderController.updateStatus(1L, request, authentication);

        assertEquals("delivered", order.getStatus());
        assertEquals("shipped", response.get("status"));
        verify(orderRepository).save(order);
    }

    @Test
    void cancelRejectsPaidOrders() {
        User owner = createUser(10L, "Customer");
        ShopOrder order = createOrder(1L, owner, "paid", 2);
        Authentication authentication = userAuthentication();

        when(currentUserService.getByEmail(authentication.getName())).thenReturn(owner);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> orderController.cancel(1L, authentication));

        assertEquals(BAD_REQUEST, exception.getStatusCode());
        verify(productRepository, never()).save(any());
    }

    @Test
    void cancelRestoresStockForPendingOrders() {
        User owner = createUser(10L, "Customer");
        ShopOrder order = createOrder(1L, owner, "pending", 2);
        Product product = order.getItems().get(0).getProduct();
        Authentication authentication = userAuthentication();

        when(currentUserService.getByEmail(authentication.getName())).thenReturn(owner);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(productRepository.save(product)).thenReturn(product);
        when(orderRepository.save(order)).thenReturn(order);

        orderController.cancel(1L, authentication);

        assertEquals("cancelled", order.getStatus());
        assertEquals(7, product.getStock());
        verify(productRepository).save(product);
        verify(orderRepository).save(order);
    }

    private Authentication userAuthentication() {
        return new UsernamePasswordAuthenticationToken(
                "user@example.com",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_USER")));
    }

    private Authentication adminAuthentication() {
        return new UsernamePasswordAuthenticationToken(
                "admin@example.com",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
    }

    private User createUser(Long id, String name) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", id);
        user.setName(name);
        return user;
    }

    private ShopOrder createOrder(Long id, User user, String status, int quantity) {
        Product product = new Product();
        ReflectionTestUtils.setField(product, "id", 100L);
        product.setName("Pomade");
        product.setPrice(50.0);
        product.setImage("pomade.png");
        product.setCategory("Styling");
        product.setDescription("Hair product");
        product.setStock(5);

        OrderItem item = new OrderItem();
        item.setProduct(product);
        item.setQuantity(quantity);
        item.setPrice(product.getPrice());

        ShopOrder order = new ShopOrder();
        ReflectionTestUtils.setField(order, "id", id);
        order.setUser(user);
        order.setStatus(status);
        order.setAddress("123 Test Street");
        order.setTotalPrice(product.getPrice() * quantity);
        order.setItems(List.of(item));
        item.setOrder(order);
        ReflectionTestUtils.setField(order, "createdAt", LocalDateTime.of(2026, 5, 15, 10, 0));
        return order;
    }
}
