package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.address.CreateUserAddressRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.address.UpdateUserAddressRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.dto.address.UserAddressResponse;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.UserAddress;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserAddressRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class UserAddressService {

    private final UserAddressRepository userAddressRepository;
    private final CurrentUserService currentUserService;

    public UserAddressService(UserAddressRepository userAddressRepository, CurrentUserService currentUserService) {
        this.userAddressRepository = userAddressRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<UserAddressResponse> getCurrentUserAddresses() {
        User user = currentUserService.getCurrentUser();
        return userAddressRepository.findByUserIdAndDeletedFalse(user.getId())
                .stream()
                .map(UserAddressResponse::from)
                .toList();
    }

    @Transactional
    public UserAddressResponse createAddress(User user, CreateUserAddressRequest request) {
        UserAddress address = new UserAddress();
        address.setUser(user);
        address.setRecipientName(normalizeOptional(request.getRecipientName(), 100));
        address.setPhone(normalizeOptional(request.getPhone(), 20));
        address.setAddressLine(normalizeRequired(request.getAddressLine(), 500, "Address line"));
        address.setWard(normalizeOptional(request.getWard(), 255));
        address.setDistrict(normalizeOptional(request.getDistrict(), 255));
        address.setCity(normalizeRequired(request.getCity(), 255, "City"));
        address.setNote(normalizeOptional(request.getNote(), 500));

        boolean shouldBeDefault = Boolean.TRUE.equals(request.getIsDefault())
                || userAddressRepository.countByUserIdAndDeletedFalse(user.getId()) == 0;

        if (shouldBeDefault) {
            userAddressRepository.clearDefaultForUser(user.getId());
        }

        address.setIsDefault(shouldBeDefault);

        UserAddress saved = userAddressRepository.save(address);
        return UserAddressResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public UserAddressResponse getAddress(User user, Long addressId) {
        UserAddress address = userAddressRepository.findByIdAndUserIdAndDeletedFalse(addressId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Address not found"));
        return UserAddressResponse.from(address);
    }

    @Transactional
    public UserAddressResponse updateAddress(User user, Long addressId, UpdateUserAddressRequest request) {
        UserAddress address = userAddressRepository.findByIdAndUserIdAndDeletedFalse(addressId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Address not found"));

        address.setRecipientName(normalizeOptional(request.getRecipientName(), 100));
        address.setPhone(normalizeOptional(request.getPhone(), 20));
        address.setAddressLine(normalizeRequired(request.getAddressLine(), 500, "Address line"));
        address.setWard(normalizeOptional(request.getWard(), 255));
        address.setDistrict(normalizeOptional(request.getDistrict(), 255));
        address.setCity(normalizeRequired(request.getCity(), 255, "City"));
        address.setNote(normalizeOptional(request.getNote(), 500));

        if (Boolean.TRUE.equals(request.getIsDefault()) && !address.getIsDefault()) {
            userAddressRepository.clearDefaultForUser(user.getId());
            address.setIsDefault(true);
        } else if (Boolean.FALSE.equals(request.getIsDefault()) && address.getIsDefault()) {
            throw new ResponseStatusException(BAD_REQUEST, "Cannot unset default address. Set another address as default instead.");
        }

        UserAddress saved = userAddressRepository.save(address);
        return UserAddressResponse.from(saved);
    }

    @Transactional
    public void deleteAddress(User user, Long addressId) {
        UserAddress address = userAddressRepository.findByIdAndUserIdAndDeletedFalse(addressId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Address not found"));

        boolean wasDefault = address.getIsDefault();

        address.setDeleted(true);
        address.setDeletedAt(LocalDateTime.now());
        address.setIsDefault(false);
        userAddressRepository.save(address);

        if (wasDefault) {
            List<UserAddress> replacements = userAddressRepository.findReplacementDefault(user.getId(), addressId);
            if (!replacements.isEmpty()) {
                UserAddress newDefault = replacements.get(0);
                newDefault.setIsDefault(true);
                userAddressRepository.save(newDefault);
            }
        }
    }

    @Transactional
    public UserAddressResponse setDefault(User user, Long addressId) {
        UserAddress address = userAddressRepository.findByIdAndUserIdAndDeletedFalse(addressId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Address not found"));

        if (!address.getIsDefault()) {
            userAddressRepository.clearDefaultForUser(user.getId());
            address.setIsDefault(true);
            userAddressRepository.save(address);
        }

        return UserAddressResponse.from(address);
    }

    @Transactional(readOnly = true)
    public UserAddressResponse getDefault(User user) {
        UserAddress address = userAddressRepository.findByUserIdAndIsDefaultTrueAndDeletedFalse(user.getId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "No default address"));
        return UserAddressResponse.from(address);
    }

    private String normalizeRequired(String value, int maxLength, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, fieldName + " is required");
        }
        String trimmed = value.trim();
        if (trimmed.length() > maxLength) {
            throw new ResponseStatusException(BAD_REQUEST, fieldName + " must be at most " + maxLength + " characters");
        }
        return trimmed;
    }

    private String normalizeOptional(String value, int maxLength) {
        if (value == null) return null;
        String trimmed = value.trim();
        if (trimmed.isEmpty()) return null;
        if (trimmed.length() > maxLength) {
            throw new ResponseStatusException(BAD_REQUEST, "Field must be at most " + maxLength + " characters");
        }
        return trimmed;
    }
}
