package com.cutie_cuts_app.example.cutie_cuts_app.dto.auth;

public class OAuthLoginRequest {

    private String provider;
    private String token;

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}