package com.cutie_cuts_app.example.cutie_cuts_app.security;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.auth.OAuthUserInfo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

    private static final String DEBUG_TOKEN_URL = "https://graph.facebook.com/debug_token";
    private static final String ME_URL = "https://graph.facebook.com/me?fields=id,name,email";

    private final String appId;
    private final String appSecret;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public FacebookTokenVerifier(
            @Value("${app.oauth.facebook.app-id}") String appId,
            @Value("${app.oauth.facebook.app-secret}") String appSecret) {
        this.appId = appId;
        this.appSecret = appSecret;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public OAuthUserInfo verify(String accessToken) {
        try {
            // Step 1: Debug token to verify it's valid and belongs to our app
            String debugUrl = DEBUG_TOKEN_URL
                    + "?input_token=" + accessToken
                    + "&access_token=" + appId + "|" + appSecret;

            HttpRequest debugRequest = HttpRequest.newBuilder()
                    .uri(URI.create(debugUrl))
                    .GET()
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> debugResponse = httpClient.send(debugRequest, HttpResponse.BodyHandlers.ofString());
            JsonNode debugJson = objectMapper.readTree(debugResponse.body());

            JsonNode data = debugJson.path("data");
            boolean isValid = data.path("is_valid").asBoolean(false);
            String applicationId = data.path("app_id").asText("");

            if (!isValid || !applicationId.equals(appId)) {
                throw new ResponseStatusException(UNAUTHORIZED, "Invalid Facebook token");
            }

            String fbUserId = data.path("user_id").asText("");

            // Step 2: Get user info from /me endpoint
            String meUrl = ME_URL + "&access_token=" + accessToken;

            HttpRequest meRequest = HttpRequest.newBuilder()
                    .uri(URI.create(meUrl))
                    .GET()
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> meResponse = httpClient.send(meRequest, HttpResponse.BodyHandlers.ofString());
            JsonNode meJson = objectMapper.readTree(meResponse.body());

            String name = meJson.path("name").asText("");
            String email = meJson.path("email").asText(null);

            // Use user_id from debug_token as it's more reliable
            return new OAuthUserInfo(fbUserId, email, name, "facebook");
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(UNAUTHORIZED, "Facebook token verification failed", e);
        }
    }
}