package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.user.UpdateUserProfileRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.user.UserDashboardResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.user.UserProfileResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Barber;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Booking;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.SalonService;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.ShopOrder;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.UserAuth;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.BookingRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ShopOrderRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserAuthRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.BAD_REQUEST;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceTest {

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserAuthRepository userAuthRepository;

    @Mock
    private ShopOrderRepository shopOrderRepository;

    @Mock
    private BookingRepository bookingRepository;

    private UserProfileService userProfileService;

    @BeforeEach
    void setUp() {
        userProfileService = new UserProfileService(
                currentUserService,
                userRepository,
                userAuthRepository,
                shopOrderRepository,
                bookingRepository);
    }

    @Test
    void getCurrentProfileReturnsExtendedProfileFields() {
        User user = createUser(1L, "Nguyen Van A");
        user.setGender("male");
        user.setPhone("0901234567");
        user.setAddress("12 Nguyen Trai");
        user.setAvatarUrl("https://cdn/avatar.png");
        user.setRole("USER");

        when(currentUserService.getByEmail("user@example.com")).thenReturn(user);
        when(userAuthRepository.findFirstByUserAndAuthTypeIgnoreCase(user, "email"))
                .thenReturn(Optional.of(createEmailAuth(user, "user@example.com")));

        UserProfileResponse response = userProfileService.getCurrentProfile("user@example.com");

        assertEquals("Nguyen Van A", response.getName());
        assertEquals("Nguyen Van A", response.getFullName());
        assertEquals("male", response.getGender());
        assertEquals("0901234567", response.getPhone());
        assertEquals("user@example.com", response.getEmail());
        assertEquals("12 Nguyen Trai", response.getAddress());
    }

    @Test
    void updateCurrentProfileAllowsClearingOptionalFields() {
        User user = createUser(1L, "Old Name");
        user.setGender("female");
        user.setPhone("0909999999");
        user.setAddress("Old address");

        UpdateUserProfileRequest request = new UpdateUserProfileRequest();
        request.setFullName("  New Name  ");
        request.setGender(" ");
        request.setPhone(" ");
        request.setAddress("  ");

        when(currentUserService.getByEmail("user@example.com")).thenReturn(user);
        when(userRepository.save(user)).thenReturn(user);
        when(userAuthRepository.findFirstByUserAndAuthTypeIgnoreCase(user, "email"))
                .thenReturn(Optional.of(createEmailAuth(user, "user@example.com")));

        UserProfileResponse response = userProfileService.updateCurrentProfile("user@example.com", request);

        assertEquals("New Name", response.getName());
        assertNull(response.getGender());
        assertNull(response.getPhone());
        assertNull(response.getAddress());
        verify(userRepository).save(user);
    }

    @Test
    void updateCurrentProfileRejectsInvalidGender() {
        User user = createUser(1L, "Old Name");
        UpdateUserProfileRequest request = new UpdateUserProfileRequest();
        request.setGender("unknown");

        when(currentUserService.getByEmail("user@example.com")).thenReturn(user);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> userProfileService.updateCurrentProfile("user@example.com", request));

        assertEquals(BAD_REQUEST, exception.getStatusCode());
    }

    @Test
    void getDashboardAggregatesSpendingAndCompletion() {
        User user = createUser(1L, "Nguyen Van A");
        user.setPhone("0901234567");
        user.setAddress("12 Nguyen Trai");
        user.setGender("male");
        user.setAvatarUrl("https://cdn/avatar.png");

        ShopOrder order = new ShopOrder();
        ReflectionTestUtils.setField(order, "id", 10L);
        order.setUser(user);
        order.setStatus("delivered");
        order.setAddress("12 Nguyen Trai");
        order.setTotalPrice(250_000.0);
        ReflectionTestUtils.setField(order, "createdAt", LocalDateTime.of(2026, 5, 20, 10, 0));

        Booking booking = new Booking();
        ReflectionTestUtils.setField(booking, "id", 11L);
        booking.setUser(user);
        booking.setStatus("done");
        booking.setDate(LocalDate.of(2026, 5, 18));
        booking.setTime(LocalTime.of(14, 30));
        booking.setPrice(120_000.0);
        booking.setBarber(createBarber(2L, "Barber B"));
        booking.setService(createService(3L, "Premium Cut"));
        ReflectionTestUtils.setField(booking, "createdAt", LocalDateTime.of(2026, 5, 18, 9, 0));

        when(currentUserService.getByEmail("user@example.com")).thenReturn(user);
        when(userAuthRepository.findFirstByUserAndAuthTypeIgnoreCase(user, "email"))
                .thenReturn(Optional.of(createEmailAuth(user, "user@example.com")));
        when(shopOrderRepository.countByUser(user)).thenReturn(3L);
        when(shopOrderRepository.countByUserAndStatusIgnoreCase(user, "delivered")).thenReturn(2L);
        when(bookingRepository.countByUser(user)).thenReturn(4L);
        when(bookingRepository.countByUserAndStatusIgnoreCase(user, "done")).thenReturn(3L);
        when(shopOrderRepository.sumTotalPriceByUserAndStatus(user, "delivered")).thenReturn(250_000.0);
        when(bookingRepository.sumPriceByUserAndStatus(user, "done")).thenReturn(120_000.0);
        when(shopOrderRepository.findFirstByUserOrderByCreatedAtDesc(user)).thenReturn(Optional.of(order));
        when(bookingRepository.findFirstByUserOrderByCreatedAtDesc(user)).thenReturn(Optional.of(booking));

        UserDashboardResponse response = userProfileService.getDashboard("user@example.com");

        assertEquals(100, response.getProfileCompletionPercent());
        assertEquals(370_000.0, response.getTotalSpent());
        assertEquals(250_000.0, response.getProductSpent());
        assertEquals(120_000.0, response.getServiceSpent());
        assertEquals(10L, response.getLatestOrder().getId());
        assertEquals(11L, response.getLatestBooking().getId());
    }

    private User createUser(Long id, String name) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", id);
        user.setName(name);
        ReflectionTestUtils.setField(user, "createdAt", LocalDateTime.of(2026, 5, 10, 8, 0));
        return user;
    }

    private UserAuth createEmailAuth(User user, String email) {
        UserAuth auth = new UserAuth();
        auth.setUser(user);
        auth.setAuthType("email");
        auth.setAuthValue(email);
        return auth;
    }

    private Barber createBarber(Long id, String name) {
        Barber barber = new Barber();
        ReflectionTestUtils.setField(barber, "id", id);
        barber.setName(name);
        barber.setRole("Barber");
        barber.setImage("barber.png");
        barber.setExperience(5);
        barber.setSpecialties("Fade");
        return barber;
    }

    private SalonService createService(Long id, String name) {
        SalonService service = new SalonService();
        service.setId(id);
        service.setName(name);
        service.setPrice(120);
        service.setDuration(45);
        service.setCategory("Hair");
        service.setDescription("Service");
        service.setImage("service.png");
        return service;
    }
}
