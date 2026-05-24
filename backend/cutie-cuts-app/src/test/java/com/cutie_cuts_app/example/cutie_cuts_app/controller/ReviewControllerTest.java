package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.domain.CreateReviewRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.OrderItem;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Product;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Review;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.ShopOrder;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.BarberRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.BookingRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ProductRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ReviewRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.SalonServiceRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ShopOrderRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.service.CurrentUserService;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.BAD_REQUEST;

@ExtendWith(MockitoExtension.class)
class ReviewControllerTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private BarberRepository barberRepository;

    @Mock
    private SalonServiceRepository serviceRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ShopOrderRepository orderRepository;

    @Mock
    private CurrentUserService currentUserService;

    private ReviewController reviewController;

    @BeforeEach
    void setUp() {
        reviewController = new ReviewController(
                reviewRepository,
                bookingRepository,
                barberRepository,
                serviceRepository,
                productRepository,
                orderRepository,
                currentUserService);
    }

    @Test
    void createProductReviewAcceptsDeliveredOrder() {
        User user = createUser(10L, "Customer");
        Product product = createProduct(100L, "Pomade");
        ShopOrder order = createOrder(1L, user, "delivered", product);
        Authentication authentication = userAuthentication();

        CreateReviewRequest request = new CreateReviewRequest();
        request.setOrderId(order.getId());
        request.setProductId(product.getId());
        request.setRating(5);
        request.setComment("Very good");

        when(currentUserService.getByEmail(authentication.getName())).thenReturn(user);
        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
        when(reviewRepository.existsByOrderIdAndProductId(order.getId(), product.getId())).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenAnswer(invocation -> {
            Review saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 50L);
            ReflectionTestUtils.setField(saved, "createdAt", LocalDateTime.of(2026, 5, 17, 12, 0));
            return saved;
        });
        when(reviewRepository.findAverageRatingByProductId(product.getId())).thenReturn(5.0);
        when(productRepository.save(product)).thenReturn(product);

        Map<String, Object> response = reviewController.create(request, authentication);

        assertEquals(50L, response.get("id"));
        assertEquals("product", response.get("reviewType"));
        assertEquals(order.getId(), response.get("orderId"));
        assertEquals(product.getId(), response.get("productId"));
        assertEquals("Pomade", response.get("productName"));
        assertEquals(5.0, product.getRating());
        verify(productRepository).save(product);
    }

    @Test
    void createProductReviewRejectsPendingOrder() {
        User user = createUser(10L, "Customer");
        Product product = createProduct(100L, "Pomade");
        ShopOrder order = createOrder(1L, user, "pending", product);
        Authentication authentication = userAuthentication();

        CreateReviewRequest request = new CreateReviewRequest();
        request.setOrderId(order.getId());
        request.setProductId(product.getId());
        request.setRating(4);
        request.setComment("Too early");

        when(currentUserService.getByEmail(authentication.getName())).thenReturn(user);
        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> reviewController.create(request, authentication));

        assertEquals(BAD_REQUEST, exception.getStatusCode());
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void createProductReviewRejectsProductOutsideOrder() {
        User user = createUser(10L, "Customer");
        Product orderedProduct = createProduct(100L, "Pomade");
        Product otherProduct = createProduct(101L, "Wax");
        ShopOrder order = createOrder(1L, user, "shipped", orderedProduct);
        Authentication authentication = userAuthentication();

        CreateReviewRequest request = new CreateReviewRequest();
        request.setOrderId(order.getId());
        request.setProductId(otherProduct.getId());
        request.setRating(3);
        request.setComment("Wrong target");

        when(currentUserService.getByEmail(authentication.getName())).thenReturn(user);
        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> reviewController.create(request, authentication));

        assertEquals(BAD_REQUEST, exception.getStatusCode());
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void getMyReviewableProductsReturnsOnlyEligibleUnreviewedItems() {
        User user = createUser(10L, "Customer");
        Product pomade = createProduct(100L, "Pomade");
        Product wax = createProduct(101L, "Wax");
        Product spray = createProduct(102L, "Spray");
        ShopOrder deliveredOrder = createOrder(1L, user, "delivered", pomade);
        ShopOrder shippedOrder = createOrder(2L, user, "shipped", wax);
        ShopOrder pendingOrder = createOrder(3L, user, "pending", spray);
        Authentication authentication = userAuthentication();

        when(currentUserService.getByEmail(authentication.getName())).thenReturn(user);
        when(orderRepository.findByUser(user)).thenReturn(List.of(deliveredOrder, shippedOrder, pendingOrder));
        when(reviewRepository.existsByOrderIdAndProductId(eq(deliveredOrder.getId()), eq(pomade.getId()))).thenReturn(false);
        when(reviewRepository.existsByOrderIdAndProductId(eq(shippedOrder.getId()), eq(wax.getId()))).thenReturn(true);

        List<Map<String, Object>> response = reviewController.getMyReviewableProducts(authentication);

        assertEquals(1, response.size());
        assertEquals(deliveredOrder.getId(), response.get(0).get("orderId"));
        assertEquals(pomade.getId(), response.get(0).get("productId"));
        assertEquals("Pomade", response.get(0).get("productName"));
    }

    private Authentication userAuthentication() {
        return new UsernamePasswordAuthenticationToken(
                "user@example.com",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_USER")));
    }

    private User createUser(Long id, String name) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", id);
        user.setName(name);
        user.setDeleted(false);
        return user;
    }

    private Product createProduct(Long id, String name) {
        Product product = new Product();
        ReflectionTestUtils.setField(product, "id", id);
        product.setName(name);
        product.setPrice(50.0);
        product.setImage(name.toLowerCase() + ".png");
        product.setCategory("Styling");
        product.setDescription("Hair product");
        product.setStock(5);
        product.setRating(4.5);
        return product;
    }

    private ShopOrder createOrder(Long id, User user, String status, Product product) {
        OrderItem item = new OrderItem();
        item.setProduct(product);
        item.setQuantity(2);
        item.setPrice(product.getPrice());

        ShopOrder order = new ShopOrder();
        ReflectionTestUtils.setField(order, "id", id);
        order.setUser(user);
        order.setStatus(status);
        order.setAddress("123 Test Street");
        order.setTotalPrice(product.getPrice() * item.getQuantity());
        order.setItems(List.of(item));
        item.setOrder(order);
        ReflectionTestUtils.setField(order, "createdAt", LocalDateTime.of(2026, 5, 15, 10, 0));
        return order;
    }
}
