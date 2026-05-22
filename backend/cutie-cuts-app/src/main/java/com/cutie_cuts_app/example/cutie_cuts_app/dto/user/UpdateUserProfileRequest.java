package com.cutie_cuts_app.example.cutie_cuts_app.dto.user;

import com.fasterxml.jackson.annotation.JsonAlias;

public class UpdateUserProfileRequest {

    @JsonAlias("name")
    private String fullName;
    private String gender;
    private String phone;
    private String address;

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }
}
