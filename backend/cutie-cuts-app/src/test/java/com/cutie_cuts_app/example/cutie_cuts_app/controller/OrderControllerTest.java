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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
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
import static org.springframework.http.HttpStatus.NOT_FOUND;

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

    @Mock
    private UserAddressRepository userAddressRepository;

    private OrderController orderController;

    @BeforeEach
    void setUp() {
        orderController = new OrderController(
                orderRepository,
                productRepository,
                currentUserService,
                notificationService,
                userAddressRepository);
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

        assertEquals("shipped", order.getStatus());
        assertEquals("shipped", response.get("status"));
        verify(orderRepository).save(order);
    }

    @Test
    void confirmReceivedMarksShippingOrderAsDeliveredForOwner() {
        User owner = createUser(10L, "Customer");
        ShopOrder order = createOrder(1L, owner, "shipped", 2);
        Authentication authentication = userAuthentication();

        when(currentUserService.getByEmail(authentication.getName())).thenReturn(owner);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        Map<String, Object> response = orderController.confirmReceived(1L, authentication);

        assertEquals("delivered", order.getStatus());
        assertEquals("delivered", response.get("status"));
        verify(orderRepository).save(order);
    }

    @Test
    void confirmReceivedRejectsShippingOrders() {
        User owner = createUser(10L, "Customer");
        ShopOrder order = createOrder(1L, owner, "shipping", 2);
        Authentication authentication = userAuthentication();

        when(currentUserService.getByEmail(authentication.getName())).thenReturn(owner);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> orderController.confirmReceived(1L, authentication));

        assertEquals(BAD_REQUEST, exception.getStatusCode());
        verify(orderRepository, never()).save(any());
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

    @Test
    void myOrdersIncludesProductIdInEachItem() {
        User owner = createUser(10L, "Customer");
        ShopOrder order = createOrder(1L, owner, "shipped", 2);
        Authentication authentication = userAuthentication();

        when(currentUserService.getByEmail(authentication.getName())).thenReturn(owner);
        when(orderRepository.findByUser(owner)).thenReturn(List.of(order));

        List<Map<String, Object>> response = orderController.myOrders(authentication);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> products = (List<Map<String, Object>>) response.get(0).get("products");
        assertEquals(100L, products.get(0).get("productId"));
    }

    // ── Create-order tests ─────────────────────────────────────────────────

    @Test
    void createWithRawAddressSucceeds() {
        User user = createUser(10L, "Customer");
        CreateOrderRequest request = new CreateOrderRequest();
        request.setAddress("123 Main St, Hanoi");
        CreateOrderRequest.CreateOrderItemRequest itemRequest = new CreateOrderRequest.CreateOrderItemRequest();
        itemRequest.setProductId(100L);
        itemRequest.setQuantity(1);
        request.setItems(List.of(itemRequest));
        Authentication authentication = userAuthentication();

        Product product = new Product();
        ReflectionTestUtils.setField(product, "id", 100L);
        product.setName("Pomade");
        product.setPrice(50.0);
        product.setStock(5);

        when(currentUserService.getByEmail("user@example.com")).thenReturn(user);
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));
        when(productRepository.deductStock(100L, 1)).thenReturn(1);
        when(orderRepository.save(any(ShopOrder.class))).thenAnswer(inv -> {
            ShopOrder o = inv.getArgument(0);
            ReflectionTestUtils.setField(o, "id", 1L);
            ReflectionTestUtils.setField(o, "createdAt", LocalDateTime.now());
            return o;
        });

        Map<String, Object> response = orderController.create(request, authentication);

        assertEquals("123 Main St, Hanoi", response.get("address"));
        assertEquals("pending", response.get("status"));
    }

    @Test
    void createWithAddressIdSucceedsAndStoresSnapshot() {
        User user = createUser(10L, "Customer");
        UserAddress address = createUserAddress(5L, user, false);
        CreateOrderRequest request = new CreateOrderRequest();
        request.setAddressId(5L);
        CreateOrderRequest.CreateOrderItemRequest itemRequest = new CreateOrderRequest.CreateOrderItemRequest();
        itemRequest.setProductId(100L);
        itemRequest.setQuantity(1);
        request.setItems(List.of(itemRequest));
        Authentication authentication = userAuthentication();

        Product product = new Product();
        ReflectionTestUtils.setField(product, "id", 100L);
        product.setName("Pomade");
        product.setPrice(50.0);
        product.setStock(5);

        when(currentUserService.getByEmail("user@example.com")).thenReturn(user);
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(5L, 10L))
                .thenReturn(Optional.of(address));
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));
        when(productRepository.deductStock(100L, 1)).thenReturn(1);
        when(orderRepository.save(any(ShopOrder.class))).thenAnswer(inv -> {
            ShopOrder o = inv.getArgument(0);
            ReflectionTestUtils.setField(o, "id", 1L);
            ReflectionTestUtils.setField(o, "createdAt", LocalDateTime.now());
            return o;
        });

        Map<String, Object> response = orderController.create(request, authentication);

        String expectedSnapshot = "Nguyen Van A - 0912345678 - 123 Nguyen Trai, Ward 5, District 1, Ho Chi Minh. Note: Call before delivery";
        assertEquals(expectedSnapshot, response.get("address"));
        assertEquals("pending", response.get("status"));
        verify(userAddressRepository).findByIdAndUserIdAndDeletedFalse(5L, 10L);
    }

    @Test
    void createWithAddressIdAndRawAddressUsesAddressIdSnapshot() {
        User user = createUser(10L, "Customer");
        UserAddress address = createUserAddress(5L, user, false);
        CreateOrderRequest request = new CreateOrderRequest();
        request.setAddress("This should be ignored");
        request.setAddressId(5L);
        CreateOrderRequest.CreateOrderItemRequest itemRequest = new CreateOrderRequest.CreateOrderItemRequest();
        itemRequest.setProductId(100L);
        itemRequest.setQuantity(1);
        request.setItems(List.of(itemRequest));
        Authentication authentication = userAuthentication();

        Product product = new Product();
        ReflectionTestUtils.setField(product, "id", 100L);
        product.setName("Pomade");
        product.setPrice(50.0);
        product.setStock(5);

        when(currentUserService.getByEmail("user@example.com")).thenReturn(user);
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(5L, 10L))
                .thenReturn(Optional.of(address));
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));
        when(productRepository.deductStock(100L, 1)).thenReturn(1);
        when(orderRepository.save(any(ShopOrder.class))).thenAnswer(inv -> {
            ShopOrder o = inv.getArgument(0);
            ReflectionTestUtils.setField(o, "id", 1L);
            ReflectionTestUtils.setField(o, "createdAt", LocalDateTime.now());
            return o;
        });

        Map<String, Object> response = orderController.create(request, authentication);

        String expectedSnapshot = "Nguyen Van A - 0912345678 - 123 Nguyen Trai, Ward 5, District 1, Ho Chi Minh. Note: Call before delivery";
        assertEquals(expectedSnapshot, response.get("address"));
    }

    @Test
    void createWithAnotherUsersAddressIdFails() {
        User user = createUser(10L, "Customer");
        CreateOrderRequest request = new CreateOrderRequest();
        request.setAddressId(5L);
        CreateOrderRequest.CreateOrderItemRequest itemRequest = new CreateOrderRequest.CreateOrderItemRequest();
        itemRequest.setProductId(100L);
        itemRequest.setQuantity(1);
        request.setItems(List.of(itemRequest));
        Authentication authentication = userAuthentication();

        when(currentUserService.getByEmail("user@example.com")).thenReturn(user);
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(5L, 10L))
                .thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> orderController.create(request, authentication));

        assertEquals(NOT_FOUND, exception.getStatusCode());
        assertEquals("Address not found", exception.getReason());
    }

    @Test
    void createWithoutAddressAndWithoutAddressIdFails() {
        User user = createUser(10L, "Customer");
        CreateOrderRequest request = new CreateOrderRequest();
        CreateOrderRequest.CreateOrderItemRequest itemRequest = new CreateOrderRequest.CreateOrderItemRequest();
        itemRequest.setProductId(100L);
        itemRequest.setQuantity(1);
        request.setItems(List.of(itemRequest));
        Authentication authentication = userAuthentication();

        when(currentUserService.getByEmail("user@example.com")).thenReturn(user);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> orderController.create(request, authentication));

        assertEquals(BAD_REQUEST, exception.getStatusCode());
        assertEquals("Address is required", exception.getReason());
    }

    @Test
    void createWithDeletedAddressFails() {
        User user = createUser(10L, "Customer");
        UserAddress deletedAddr = createUserAddress(5L, user, true);
        CreateOrderRequest request = new CreateOrderRequest();
        request.setAddressId(5L);
        CreateOrderRequest.CreateOrderItemRequest itemRequest = new CreateOrderRequest.CreateOrderItemRequest();
        itemRequest.setProductId(100L);
        itemRequest.setQuantity(1);
        request.setItems(List.of(itemRequest));
        Authentication authentication = userAuthentication();

        when(currentUserService.getByEmail("user@example.com")).thenReturn(user);
        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(5L, 10L))
                .thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> orderController.create(request, authentication));

        assertEquals(NOT_FOUND, exception.getStatusCode());
    }

    // ── Helper methods ──────────────────────────────────────────────────────

    @Test
    void getAllUsesStableNewestFirstSortForAdmin() {
        User newerOwner = createUser(10L, "Newer Customer");
        User olderOwner = createUser(11L, "Older Customer");
        ShopOrder newerOrder = createOrder(2L, newerOwner, "pending", 1);
        ShopOrder olderOrder = createOrder(1L, olderOwner, "pending", 1);
        Authentication authentication = adminAuthentication();

        ReflectionTestUtils.setField(newerOrder, "createdAt", LocalDateTime.of(2026, 5, 16, 10, 0));
        ReflectionTestUtils.setField(olderOrder, "createdAt", LocalDateTime.of(2026, 5, 15, 10, 0));

        when(orderRepository.findAll(org.mockito.ArgumentMatchers.<Sort>any()))
                .thenReturn(List.of(newerOrder, olderOrder));

        List<Map<String, Object>> response = orderController.getAll(authentication);

        verify(orderRepository).findAll(org.mockito.ArgumentMatchers.<Sort>argThat(sort ->
                sort.equals(Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")))));
        assertEquals(2L, response.get(0).get("id"));
        assertEquals(1L, response.get(1).get("id"));
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

    private UserAddress createUserAddress(Long id, User user, boolean deleted) {
        UserAddress address = new UserAddress();
        ReflectionTestUtils.setField(address, "id", id);
        address.setUser(user);
        address.setRecipientName("Nguyen Van A");
        address.setPhone("0912345678");
        address.setAddressLine("123 Nguyen Trai");
        address.setWard("Ward 5");
        address.setDistrict("District 1");
        address.setCity("Ho Chi Minh");
        address.setNote("Call before delivery");
        address.setIsDefault(false);
        address.setDeleted(deleted);
        return address;
    }
}
