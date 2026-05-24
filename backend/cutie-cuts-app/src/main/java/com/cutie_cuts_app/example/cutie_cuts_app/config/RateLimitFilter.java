package com.cutie_cuts_app.example.cutie_cuts_app.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

/**
 * Rate-limit filter registered AFTER JwtFilter so SecurityContext is populated.
 * Uses user email for authenticated requests; falls back to client IP.
 * In-memory — resets on restart. Not suitable for multi-instance deployments.
 */
public class RateLimitFilter extends OncePerRequestFilter {

    private final InMemoryRateLimiter rateLimiter;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RateLimitFilter(InMemoryRateLimiter rateLimiter) {
        this.rateLimiter = rateLimiter;
    }

    private static final class Rule {
        final String path;
        final HttpMethod method;
        final int maxRequests;
        final Duration window;
        final Function<HttpServletRequest, String> keyResolver;

        Rule(String path, HttpMethod method, int maxRequests, Duration window,
             Function<HttpServletRequest, String> keyResolver) {
            this.path = path;
            this.method = method;
            this.maxRequests = maxRequests;
            this.window = window;
            this.keyResolver = keyResolver;
        }
    }

    private final List<Rule> rules = List.of(
            new Rule("/auth/login", HttpMethod.POST, 5, Duration.ofMinutes(15), this::ipKey),
            new Rule("/auth/register", HttpMethod.POST, 3, Duration.ofMinutes(60), this::ipKey),
            new Rule("/bookings", HttpMethod.POST, 10, Duration.ofMinutes(10), this::userOrIpKey),
            new Rule("/api/orders", HttpMethod.POST, 20, Duration.ofMinutes(10), this::userOrIpKey),
            new Rule("/api/uploads/presign", HttpMethod.POST, 30, Duration.ofMinutes(5), this::userOrIpKey),
            new Rule("/api/reviews", HttpMethod.POST, 20, Duration.ofMinutes(10), this::userOrIpKey),
            new Rule("/auth/forgot-password", HttpMethod.POST, 3, Duration.ofMinutes(60), this::ipKey),
            new Rule("/auth/reset-password", HttpMethod.POST, 5, Duration.ofMinutes(15), this::ipKey),
            new Rule("/auth/verify-email", HttpMethod.POST, 5, Duration.ofMinutes(15), this::ipKey),
            new Rule("/auth/resend-verification", HttpMethod.POST, 3, Duration.ofMinutes(60), this::ipKey)
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String requestPath = request.getRequestURI();
        String method = request.getMethod();

        for (Rule rule : rules) {
            if (rule.method.matches(method) && requestPath.equals(rule.path)) {
                String key = rule.keyResolver.apply(request);
                if (!rateLimiter.tryConsume(key, rule.maxRequests, rule.window)) {
                    long retryAfter = rateLimiter.retryAfterSeconds(key, rule.window);
                    response.setStatus(429);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    Map<String, Object> body = new LinkedHashMap<>();
                    body.put("error", "Too many requests");
                    body.put("retryAfterSeconds", retryAfter);
                    objectMapper.writeValue(response.getWriter(), body);
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private String ipKey(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        return xff != null ? xff.split(",")[0].trim() : request.getRemoteAddr();
    }

    private String userOrIpKey(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getName() != null) {
            return auth.getName();
        }
        return ipKey(request);
    }
}
