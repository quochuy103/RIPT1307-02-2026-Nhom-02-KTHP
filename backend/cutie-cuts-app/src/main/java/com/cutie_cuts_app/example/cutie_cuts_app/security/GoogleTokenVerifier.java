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

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Component
public class GoogleTokenVerifier {

    private static final Logger log = LoggerFactory.getLogger(GoogleTokenVerifier.class);
    private static final String TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo?access_token=";
    private static final String USER_INFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

    private final String clientId;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public GoogleTokenVerifier(@Value("${app.oauth.google.client-id}") String clientId) {
        this.clientId = clientId;
    }

    public OAuthUserInfo verify(String accessToken) {
        try {
            // Call Google's tokeninfo endpoint to verify the access token
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(TOKEN_INFO_URL + accessToken))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Google token verification failed: status={}, body={}", response.statusCode(),
                        response.body());
                throw new ResponseStatusException(UNAUTHORIZED, "Invalid Google token");
            }

            JsonNode json = objectMapper.readTree(response.body());

            // Verify the token is for our app
            String aud = json.has("aud") ? json.get("aud").asText() : null;
            String azp = json.has("azp") ? json.get("azp").asText() : null;

            if (clientId != null && !clientId.isBlank()) {
                boolean matched = clientId.equals(aud) || clientId.equals(azp);
                if (!matched) {
                    log.error("Google token audience mismatch: expected={}, aud={}, azp={}", clientId, aud, azp);
                    throw new ResponseStatusException(UNAUTHORIZED, "Google token audience mismatch");
                }
            }

            String userId = json.has("sub") ? json.get("sub").asText() : null;
            String email = json.has("email") ? json.get("email").asText() : null;
            String name = json.has("name") ? json.get("name").asText() : null;

            if (userId == null) {
                throw new ResponseStatusException(UNAUTHORIZED, "Invalid Google token: missing subject");
            }

            // Fetch user profile for name if not in tokeninfo
            if (name == null || email == null) {
                JsonNode profile = fetchUserInfo(accessToken);
                if (name == null && profile != null && profile.has("name")) {
                    name = profile.get("name").asText();
                }
                if (email == null && profile != null && profile.has("email")) {
                    email = profile.get("email").asText();
                }
            }

            return new OAuthUserInfo(userId, email, name, "google");
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google token verification error", e);
            throw new ResponseStatusException(UNAUTHORIZED, "Google token verification failed", e);
        }
    }

    private JsonNode fetchUserInfo(String accessToken) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(USER_INFO_URL))
                    .header("Authorization", "Bearer " + accessToken)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return objectMapper.readTree(response.body());
            }
            log.warn("Failed to fetch Google user info: status={}", response.statusCode());
            return null;
        } catch (Exception e) {
            log.warn("Error fetching Google user info", e);
            return null;
        }
    }
}
