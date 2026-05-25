package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.ChangePasswordRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.user.UpdateUserProfileRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.user.UserBookingHistoryResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.user.UserDashboardResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.user.UserOrderHistoryResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.user.UserProfileResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.service.AuthService;
import com.cutie_cuts_app.example.cutie_cuts_app.service.UserProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:5173"})
@Tag(name = "User Profile", description = "Personal profile and dashboard APIs for the authenticated user")
public class UserController {

    private final UserProfileService userProfileService;
    private final AuthService authService;

    public UserController(UserProfileService userProfileService, AuthService authService) {
        this.userProfileService = userProfileService;
        this.authService = authService;
    }

    @GetMapping("/me")
    @Operation(summary = "Get my profile", description = "Returns the authenticated user's personal profile information.")
    public UserProfileResponse getMe(Authentication authentication) {
        return userProfileService.getCurrentProfile(authentication.getName());
    }

    @PatchMapping("/me")
    @Operation(summary = "Update my profile", description = "Updates editable profile fields such as full name, gender, phone number, and address.")
    public UserProfileResponse updateMe(
            Authentication authentication,
            @Valid @RequestBody UpdateUserProfileRequest request) {
        return userProfileService.updateCurrentProfile(authentication.getName(), request);
    }

    @PatchMapping("/me/password")
    @Operation(summary = "Change my password", description = "Changes the authenticated user's password and invalidates previously issued JWTs.")
    public ResponseEntity<Void> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        authService.changePassword(authentication.getName(), request, authorizationHeader);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/dashboard")
    @Operation(summary = "Get my dashboard", description = "Returns profile completion, spending statistics, and the latest order and booking summaries.")
    public UserDashboardResponse getDashboard(Authentication authentication) {
        return userProfileService.getDashboard(authentication.getName());
    }

    @GetMapping("/me/orders")
    @Operation(summary = "Get my order history", description = "Returns paginated order history for the authenticated user. Optional status filter is supported.")
    public Page<UserOrderHistoryResponse> getMyOrders(
            Authentication authentication,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return userProfileService.getMyOrders(authentication.getName(), status, pageable);
    }

    @GetMapping("/me/bookings")
    @Operation(summary = "Get my booking history", description = "Returns paginated booking history for the authenticated user. Optional status filter is supported.")
    public Page<UserBookingHistoryResponse> getMyBookings(
            Authentication authentication,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return userProfileService.getMyBookings(authentication.getName(), status, pageable);
    }
}
