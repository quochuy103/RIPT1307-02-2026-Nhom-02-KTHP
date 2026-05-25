package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.address.CreateUserAddressRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.address.UpdateUserAddressRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.address.UserAddressResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.UserAddress;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserAddressRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserAddressServiceTest {

    @Mock
    private UserAddressRepository userAddressRepository;

    @Mock
    private CurrentUserService currentUserService;

    private UserAddressService userAddressService;
    private User user;

    @BeforeEach
    void setUp() {
        userAddressService = new UserAddressService(userAddressRepository, currentUserService);

        user = new User();
        ReflectionTestUtils.setField(user, "id", 1L);
        user.setName("Test User");
    }

    @Test
    void createFirstAddressAutomaticallyBecomesDefault() {
        CreateUserAddressRequest request = createRequest("12 Nguyen Trai", "Hanoi", false);

        when(userAddressRepository.countByUserIdAndDeletedFalse(1L)).thenReturn(0L);
        when(userAddressRepository.save(any(UserAddress.class))).thenAnswer(inv -> {
            UserAddress a = inv.getArgument(0);
            ReflectionTestUtils.setField(a, "id", 1L);
            ReflectionTestUtils.setField(a, "createdAt", LocalDateTime.now());
            ReflectionTestUtils.setField(a, "updatedAt", LocalDateTime.now());
            return a;
        });

        UserAddressResponse response = userAddressService.createAddress(user, request);

        assertTrue(response.getIsDefault());
        verify(userAddressRepository).clearDefaultForUser(1L);
    }

    @Test
    void createSecondAddressWithIsDefaultTrueClearsPreviousDefault() {
        CreateUserAddressRequest request = createRequest("456 Le Loi", "HCMC", true);

        when(userAddressRepository.save(any(UserAddress.class))).thenAnswer(inv -> {
            UserAddress a = inv.getArgument(0);
            ReflectionTestUtils.setField(a, "id", 2L);
            ReflectionTestUtils.setField(a, "createdAt", LocalDateTime.now());
            ReflectionTestUtils.setField(a, "updatedAt", LocalDateTime.now());
            return a;
        });

        UserAddressResponse response = userAddressService.createAddress(user, request);

        assertTrue(response.getIsDefault());
        verify(userAddressRepository).clearDefaultForUser(1L);
    }

    @Test
    void setDefaultClearsOtherDefaults() {
        UserAddress address = createAddress(2L, false);

        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(2L, 1L))
                .thenReturn(Optional.of(address));

        userAddressService.setDefault(user, 2L);

        verify(userAddressRepository).clearDefaultForUser(1L);
        assertTrue(address.getIsDefault());
    }

    @Test
    void deleteDefaultSelectsReplacement() {
        UserAddress defaultAddr = createAddress(1L, true);
        UserAddress replacement = createAddress(2L, false);
        ReflectionTestUtils.setField(replacement, "updatedAt", LocalDateTime.now().plusHours(1));

        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(1L, 1L))
                .thenReturn(Optional.of(defaultAddr));
        when(userAddressRepository.findReplacementDefault(1L, 1L))
                .thenReturn(List.of(replacement));

        userAddressService.deleteAddress(user, 1L);

        assertTrue(defaultAddr.getDeleted());
        assertFalse(defaultAddr.getIsDefault());
        assertTrue(replacement.getIsDefault());
        verify(userAddressRepository).save(defaultAddr);
        verify(userAddressRepository).save(replacement);
    }

    @Test
    void deleteDefaultWithNoOtherAddressesDoesNotSetNewDefault() {
        UserAddress defaultAddr = createAddress(1L, true);

        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(1L, 1L))
                .thenReturn(Optional.of(defaultAddr));
        when(userAddressRepository.findReplacementDefault(1L, 1L))
                .thenReturn(List.of());

        userAddressService.deleteAddress(user, 1L);

        assertTrue(defaultAddr.getDeleted());
        assertFalse(defaultAddr.getIsDefault());
        verify(userAddressRepository).save(defaultAddr);
    }

    @Test
    void userCannotAccessAnotherUsersAddress() {
        User otherUser = new User();
        ReflectionTestUtils.setField(otherUser, "id", 99L);

        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(1L, 99L))
                .thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> userAddressService.getAddress(otherUser, 1L));

        assertEquals("Address not found", ex.getReason());
    }

    @Test
    void missingRequiredFieldsRejected() {
        CreateUserAddressRequest request = new CreateUserAddressRequest();
        request.setCity("Hanoi");

        // addressLine is null — should throw at service level validation
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> userAddressService.createAddress(user, request));

        assertTrue(ex.getMessage().contains("Address line is required")
                || ex.getReason().contains("Address line is required"));
    }

    @Test
    void getAddressesReturnsOnlyNonDeleted() {
        when(currentUserService.getCurrentUser()).thenReturn(user);
        UserAddress addr = createAddress(1L, true);
        when(userAddressRepository.findByUserIdAndDeletedFalse(1L))
                .thenReturn(List.of(addr));

        List<UserAddressResponse> addresses = userAddressService.getCurrentUserAddresses();

        assertEquals(1, addresses.size());
        assertEquals(1L, addresses.get(0).getId());
    }

    @Test
    void getDefaultReturnsCorrectAddress() {
        UserAddress defaultAddr = createAddress(3L, true);
        when(userAddressRepository.findByUserIdAndIsDefaultTrueAndDeletedFalse(1L))
                .thenReturn(Optional.of(defaultAddr));

        UserAddressResponse response = userAddressService.getDefault(user);

        assertEquals(3L, response.getId());
        assertTrue(response.getIsDefault());
    }

    @Test
    void deleteNonDefaultDoesNotTriggerReplacement() {
        UserAddress addr = createAddress(2L, false);

        when(userAddressRepository.findByIdAndUserIdAndDeletedFalse(2L, 1L))
                .thenReturn(Optional.of(addr));

        userAddressService.deleteAddress(user, 2L);

        assertTrue(addr.getDeleted());
        verify(userAddressRepository, never()).findReplacementDefault(anyLong(), anyLong());
    }

    private CreateUserAddressRequest createRequest(String addressLine, String city, boolean isDefault) {
        CreateUserAddressRequest req = new CreateUserAddressRequest();
        req.setRecipientName("Nguyen Van A");
        req.setPhone("0901234567");
        req.setAddressLine(addressLine);
        req.setDistrict("District 1");
        req.setCity(city);
        req.setNote("Near the park");
        req.setIsDefault(isDefault);
        return req;
    }

    private UserAddress createAddress(Long id, boolean isDefault) {
        UserAddress addr = new UserAddress();
        ReflectionTestUtils.setField(addr, "id", id);
        addr.setUser(user);
        addr.setRecipientName("Nguyen Van A");
        addr.setAddressLine("12 Nguyen Trai");
        addr.setCity("Hanoi");
        addr.setIsDefault(isDefault);
        addr.setDeleted(false);
        ReflectionTestUtils.setField(addr, "createdAt", LocalDateTime.now());
        ReflectionTestUtils.setField(addr, "updatedAt", LocalDateTime.now());
        return addr;
    }
}
