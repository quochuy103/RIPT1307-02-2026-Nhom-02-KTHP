package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.address.CreateUserAddressRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.address.UpdateUserAddressRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.address.UserAddressResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.service.CurrentUserService;
import com.cutie_cuts_app.example.cutie_cuts_app.service.UserAddressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/me/addresses")
@Tag(name = "User Addresses", description = "Saved addresses for the authenticated user")
public class UserAddressController {

    private final UserAddressService userAddressService;
    private final CurrentUserService currentUserService;

    public UserAddressController(UserAddressService userAddressService, CurrentUserService currentUserService) {
        this.userAddressService = userAddressService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    @Operation(summary = "List my addresses", description = "Returns all non-deleted addresses for the authenticated user.")
    public List<UserAddressResponse> getAll() {
        return userAddressService.getCurrentUserAddresses();
    }

    @PostMapping
    @Operation(summary = "Create address", description = "Creates a new address for the authenticated user. First address automatically becomes default.")
    public UserAddressResponse create(@Valid @RequestBody CreateUserAddressRequest request) {
        User user = currentUserService.getCurrentUser();
        return userAddressService.createAddress(user, request);
    }

    @GetMapping("/default")
    @Operation(summary = "Get default address", description = "Returns the default address for the authenticated user.")
    public UserAddressResponse getDefault() {
        User user = currentUserService.getCurrentUser();
        return userAddressService.getDefault(user);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get address", description = "Returns a single address owned by the authenticated user.")
    public UserAddressResponse getOne(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        return userAddressService.getAddress(user, id);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update address", description = "Fully updates an address owned by the authenticated user.")
    public UserAddressResponse update(@PathVariable Long id, @Valid @RequestBody UpdateUserAddressRequest request) {
        User user = currentUserService.getCurrentUser();
        return userAddressService.updateAddress(user, id, request);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete address", description = "Soft-deletes an address owned by the authenticated user. If deleting the default, another address becomes default.")
    public void delete(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        userAddressService.deleteAddress(user, id);
    }

    @PatchMapping("/{id}/default")
    @Operation(summary = "Set default address", description = "Sets the specified address as the default for the authenticated user.")
    public UserAddressResponse setDefault(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        return userAddressService.setDefault(user, id);
    }
}
