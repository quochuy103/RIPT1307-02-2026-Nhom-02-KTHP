package com.cutie_cuts_app.example.cutie_cuts_app.config;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple in-memory sliding-window rate limiter.
 * Limits reset on application restart. Not suitable for multi-instance deployments.
 */
@Component
public class InMemoryRateLimiter {

    private final ConcurrentHashMap<String, Deque<Long>> windows = new ConcurrentHashMap<>();

    public boolean tryConsume(String key, int maxRequests, Duration window) {
        Deque<Long> deque = windows.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (deque) {
            long now = Instant.now().toEpochMilli();
            long cutoff = now - window.toMillis();
            while (!deque.isEmpty() && deque.peekFirst() < cutoff) {
                deque.pollFirst();
            }
            if (deque.size() >= maxRequests) {
                return false;
            }
            deque.addLast(now);
            return true;
        }
    }

    public long retryAfterSeconds(String key, Duration window) {
        Deque<Long> deque = windows.get(key);
        if (deque == null || deque.isEmpty()) {
            return 0;
        }
        synchronized (deque) {
            if (deque.isEmpty()) {
                return 0;
            }
            long oldest = deque.peekFirst();
            long expiresAt = oldest + window.toMillis();
            long seconds = (expiresAt - Instant.now().toEpochMilli()) / 1000;
            return Math.max(seconds, 1);
        }
    }
}
