package com.cutie_cuts_app.example.cutie_cuts_app.dto.address;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateUserAddressRequest {

    @Size(max = 100)
    private String recipientName;

    @Size(max = 20)
    private String phone;

    @NotBlank(message = "Address line is required")
    @Size(max = 500)
    private String addressLine;

    @Size(max = 255)
    private String ward;

    @Size(max = 255)
    private String district;

    @NotBlank(message = "City is required")
    @Size(max = 255)
    private String city;

    @Size(max = 500)
    private String note;

    private Boolean isDefault;

    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddressLine() { return addressLine; }
    public void setAddressLine(String addressLine) { this.addressLine = addressLine; }

    public String getWard() { return ward; }
    public void setWard(String ward) { this.ward = ward; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public Boolean getIsDefault() { return isDefault; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault; }
}
