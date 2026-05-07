package com.cutie_cuts_app.example.cutie_cuts_app.security;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.OAuthUserInfo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Component
public class FacebookTokenVerifier {

    private static final Logger log = LoggerFactory.getLogger(FacebookTokenVerifier.class);
    private static final String ME_URL = "https://graph.facebook.com/me?fields=id,name,email";

    private final String appId;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public FacebookTokenVerifier(
            @Value("${app.oauth.facebook.app-id}") String appId) {
        this.appId = appId;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public OAuthUserInfo verify(String accessToken) {
        try {
            // Call /me endpoint directly with user's access token (same approach as Google)
            String meUrl = ME_URL + "&access_token=" + accessToken;

            HttpRequest meRequest = HttpRequest.newBuilder()
                    .uri(URI.create(meUrl))
                    .GET()
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> meResponse = httpClient.send(meRequest, HttpResponse.BodyHandlers.ofString());

            if (meResponse.statusCode() != 200) {
                log.error("Facebook token verification failed: status={}, body={}", meResponse.statusCode(),
                        meResponse.body());
                throw new ResponseStatusException(UNAUTHORIZED, "Invalid Facebook token");
            }

            JsonNode meJson = objectMapper.readTree(meResponse.body());

            // Check for error response
            if (meJson.has("error")) {
                log.error("Facebook /me error: {}", meJson.get("error"));
                throw new ResponseStatusException(UNAUTHORIZED, "Invalid Facebook token");
            }

            String fbUserId = meJson.path("id").asText("");
            String name = meJson.path("name").asText("");
            String email = meJson.path("email").asText(null);

            if (fbUserId.isEmpty()) {
                throw new ResponseStatusException(UNAUTHORIZED, "Invalid Facebook token: missing user id");
            }

            return new OAuthUserInfo(fbUserId, email, name, "facebook");
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Facebook token verification error", e);
            throw new ResponseStatusException(UNAUTHORIZED, "Facebook token verification failed", e);
        }
    }
}