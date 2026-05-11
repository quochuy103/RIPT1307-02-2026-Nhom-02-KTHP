package com.cutie_cuts_app.example.cutie_cuts_app.dto.auth;

/**
 * Standardized OAuth user info returned after verifying a token with any
 * provider.
 *
 * @param providerId unique user ID from the OAuth provider (e.g. Google sub)
 * @param email      verified email from the provider (may be null if not
 *                   shared)
 * @param name       display name from the provider
 * @param provider   lowercase provider name: "google"
 */
public record OAuthUserInfo(String providerId, String email, String name, String provider) {
}