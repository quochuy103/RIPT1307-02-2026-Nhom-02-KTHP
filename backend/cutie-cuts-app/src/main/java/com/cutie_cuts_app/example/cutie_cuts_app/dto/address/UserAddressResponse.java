package com.cutie_cuts_app.example.cutie_cuts_app.dto.address;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.UserAddress;
import java.time.LocalDateTime;

public class UserAddressResponse {

    private final Long id;
    private final String recipientName;
    private final String phone;
    private final String addressLine;
    private final String ward;
    private final String district;
    private final String city;
    private final String note;
    private final boolean isDefault;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public UserAddressResponse(
            Long id,
            String recipientName,
            String phone,
            String addressLine,
            String ward,
            String district,
            String city,
            String note,
            boolean isDefault,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
        this.id = id;
        this.recipientName = recipientName;
        this.phone = phone;
        this.addressLine = addressLine;
        this.ward = ward;
        this.district = district;
        this.city = city;
        this.note = note;
        this.isDefault = isDefault;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static UserAddressResponse from(UserAddress address) {
        return new UserAddressResponse(
                address.getId(),
                address.getRecipientName(),
                address.getPhone(),
                address.getAddressLine(),
                address.getWard(),
                address.getDistrict(),
                address.getCity(),
                address.getNote(),
                address.getIsDefault(),
                address.getCreatedAt(),
                address.getUpdatedAt());
    }

    public Long getId() { return id; }
    public String getRecipientName() { return recipientName; }
    public String getPhone() { return phone; }
    public String getAddressLine() { return addressLine; }
    public String getWard() { return ward; }
    public String getDistrict() { return district; }
    public String getCity() { return city; }
    public String getNote() { return note; }
    public boolean getIsDefault() { return isDefault; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
