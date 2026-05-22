package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.user.UpdateUserProfileRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.user.UserBookingHistoryResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.user.UserDashboardResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.user.UserOrderHistoryResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.user.UserProfileResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Booking;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.OrderItem;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.ShopOrder;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.BookingRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ShopOrderRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserAuthRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.util.DomainStatusRules;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class UserProfileService {

    private static final Set<String> ALLOWED_GENDERS = Set.of("male", "female", "other");
    private static final int PROFILE_COMPLETION_FIELD_COUNT = 6;

    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;
    private final UserAuthRepository userAuthRepository;
    private final ShopOrderRepository shopOrderRepository;
    private final BookingRepository bookingRepository;

    public UserProfileService(
            CurrentUserService currentUserService,
            UserRepository userRepository,
            UserAuthRepository userAuthRepository,
            ShopOrderRepository shopOrderRepository,
            BookingRepository bookingRepository) {
        this.currentUserService = currentUserService;
        this.userRepository = userRepository;
        this.userAuthRepository = userAuthRepository;
        this.shopOrderRepository = shopOrderRepository;
        this.bookingRepository = bookingRepository;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentProfile(String email) {
        User user = currentUserService.getByEmail(email);
        return toProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updateCurrentProfile(String email, UpdateUserProfileRequest request) {
        User user = currentUserService.getByEmail(email);

        if (request.getFullName() != null) {
            user.setName(normalizeRequiredText(request.getFullName(), "Full name"));
        }
        if (request.getGender() != null) {
            user.setGender(normalizeGender(request.getGender()));
        }
        if (request.getPhone() != null) {
            user.setPhone(normalizePhone(request.getPhone()));
        }
        if (request.getAddress() != null) {
            user.setAddress(normalizeOptionalText(request.getAddress(), 255, "Address"));
        }

        User saved = userRepository.save(user);
        return toProfileResponse(saved);
    }

    @Transactional(readOnly = true)
    public UserDashboardResponse getDashboard(String email) {
        User user = currentUserService.getByEmail(email);

        long totalOrders = shopOrderRepository.countByUser(user);
        long completedOrders = shopOrderRepository.countByUserAndStatusIgnoreCase(user, "delivered");
        long totalBookings = bookingRepository.countByUser(user);
        long completedBookings = bookingRepository.countByUserAndStatusIgnoreCase(user, "done");

        double productSpent = defaultDouble(shopOrderRepository.sumTotalPriceByUserAndStatus(user, "delivered"));
        double serviceSpent = defaultDouble(bookingRepository.sumPriceByUserAndStatus(user, "done"));

        UserDashboardResponse.OrderSummary latestOrder = shopOrderRepository.findFirstByUserOrderByCreatedAtDesc(user)
                .map(this::toOrderSummary)
                .orElse(null);
        UserDashboardResponse.BookingSummary latestBooking = bookingRepository.findFirstByUserOrderByCreatedAtDesc(user)
                .map(this::toBookingSummary)
                .orElse(null);

        return new UserDashboardResponse(
                calculateProfileCompletionPercent(user, resolveEmail(user)),
                totalOrders,
                completedOrders,
                totalBookings,
                completedBookings,
                productSpent + serviceSpent,
                productSpent,
                serviceSpent,
                latestOrder,
                latestBooking);
    }

    @Transactional(readOnly = true)
    public Page<UserOrderHistoryResponse> getMyOrders(String email, String status, Pageable pageable) {
        User user = currentUserService.getByEmail(email);
        String normalizedStatus = normalizeStatusFilter(status);
        Page<ShopOrder> page = normalizedStatus == null
                ? shopOrderRepository.findByUser(user, pageable)
                : shopOrderRepository.findByUserAndStatusIgnoreCase(user, normalizedStatus, pageable);
        return page.map(this::toOrderHistoryResponse);
    }

    @Transactional(readOnly = true)
    public Page<UserBookingHistoryResponse> getMyBookings(String email, String status, Pageable pageable) {
        User user = currentUserService.getByEmail(email);
        String normalizedStatus = normalizeStatusFilter(status);
        Page<Booking> page = normalizedStatus == null
                ? bookingRepository.findByUser(user, pageable)
                : bookingRepository.findByUserAndStatusIgnoreCase(user, normalizedStatus, pageable);
        return page.map(this::toBookingHistoryResponse);
    }

    private UserProfileResponse toProfileResponse(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getGender(),
                user.getPhone(),
                resolveEmail(user),
                user.getAddress(),
                user.getAvatarUrl(),
                user.getRole() == null ? "user" : user.getRole().toLowerCase(Locale.ROOT),
                user.getCreatedAt());
    }

    private UserDashboardResponse.OrderSummary toOrderSummary(ShopOrder order) {
        return new UserDashboardResponse.OrderSummary(
                order.getId(),
                DomainStatusRules.normalizeOrderStatusForResponse(order.getStatus()),
                defaultDouble(order.getTotalPrice()),
                order.getAddress(),
                order.getCreatedAt());
    }

    private UserDashboardResponse.BookingSummary toBookingSummary(Booking booking) {
        return new UserDashboardResponse.BookingSummary(
                booking.getId(),
                booking.getStatus(),
                booking.getService().getName(),
                booking.getBarber().getName(),
                defaultDouble(booking.getPrice()),
                booking.getDate(),
                booking.getTime(),
                booking.getCreatedAt());
    }

    private UserOrderHistoryResponse toOrderHistoryResponse(ShopOrder order) {
        List<UserOrderHistoryResponse.ProductItem> products = order.getItems().stream()
                .map(this::toOrderProductItem)
                .toList();

        return new UserOrderHistoryResponse(
                order.getId(),
                DomainStatusRules.normalizeOrderStatusForResponse(order.getStatus()),
                defaultDouble(order.getTotalPrice()),
                order.getAddress(),
                order.getCreatedAt(),
                products);
    }

    private UserOrderHistoryResponse.ProductItem toOrderProductItem(OrderItem item) {
        return new UserOrderHistoryResponse.ProductItem(
                item.getProduct().getId(),
                item.getProduct().getName(),
                item.getQuantity(),
                defaultDouble(item.getPrice()));
    }

    private UserBookingHistoryResponse toBookingHistoryResponse(Booking booking) {
        return new UserBookingHistoryResponse(
                booking.getId(),
                booking.getStatus(),
                booking.getService().getName(),
                booking.getBarber().getName(),
                defaultDouble(booking.getPrice()),
                booking.getDate(),
                booking.getTime(),
                booking.getCreatedAt());
    }

    private String resolveEmail(User user) {
        return userAuthRepository.findFirstByUserAndAuthTypeIgnoreCase(user, "email")
                .map(auth -> auth.getAuthValue())
                .orElse(null);
    }

    private int calculateProfileCompletionPercent(User user, String email) {
        int completed = 0;
        if (hasText(user.getName())) {
            completed++;
        }
        if (hasText(user.getGender())) {
            completed++;
        }
        if (hasText(user.getPhone())) {
            completed++;
        }
        if (hasText(email)) {
            completed++;
        }
        if (hasText(user.getAddress())) {
            completed++;
        }
        if (hasText(user.getAvatarUrl())) {
            completed++;
        }
        return (int) Math.round(completed * 100.0 / PROFILE_COMPLETION_FIELD_COUNT);
    }

    private String normalizeRequiredText(String value, String fieldName) {
        String normalized = normalizeOptionalText(value, 100, fieldName);
        if (normalized == null) {
            throw new ResponseStatusException(BAD_REQUEST, fieldName + " must not be blank");
        }
        return normalized;
    }

    private String normalizeOptionalText(String value, int maxLength, String fieldName) {
        String normalized = value == null ? null : value.trim();
        if (normalized == null || normalized.isEmpty()) {
            return null;
        }
        if (normalized.length() > maxLength) {
            throw new ResponseStatusException(BAD_REQUEST, fieldName + " must be at most " + maxLength + " characters");
        }
        return normalized;
    }

    private String normalizePhone(String value) {
        String normalized = normalizeOptionalText(value, 20, "Phone");
        if (normalized == null) {
            return null;
        }
        if (!normalized.matches("[0-9+()\\-\\s]{8,20}")) {
            throw new ResponseStatusException(BAD_REQUEST, "Phone number format is invalid");
        }
        return normalized;
    }

    private String normalizeGender(String value) {
        String normalized = normalizeOptionalText(value, 20, "Gender");
        if (normalized == null) {
            return null;
        }
        String lowerCase = normalized.toLowerCase(Locale.ROOT);
        if (!ALLOWED_GENDERS.contains(lowerCase)) {
            throw new ResponseStatusException(BAD_REQUEST, "Gender must be one of: male, female, other");
        }
        return lowerCase;
    }

    private String normalizeStatusFilter(String status) {
        return Optional.ofNullable(status)
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .orElse(null);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private double defaultDouble(Double value) {
        return value == null ? 0.0 : value;
    }
}
