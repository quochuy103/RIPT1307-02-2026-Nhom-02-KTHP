package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.ApiCacheEntry;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Booking;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ApiCacheEntryRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.BookingRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ShopOrderRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
public class AdminDashboardService {

    private static final String CACHE_KEY = "admin-dashboard:v1";

    private final BookingRepository bookingRepository;
    private final ShopOrderRepository shopOrderRepository;
    private final UserRepository userRepository;
    private final ApiCacheEntryRepository apiCacheEntryRepository;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    @Value("${app.cache.admin-dashboard.ttl-seconds:60}")
    private long cacheTtlSeconds;

    public AdminDashboardService(
            BookingRepository bookingRepository,
            ShopOrderRepository shopOrderRepository,
            UserRepository userRepository,
            ApiCacheEntryRepository apiCacheEntryRepository,
            ObjectMapper objectMapper,
            Clock clock) {
        this.bookingRepository = bookingRepository;
        this.shopOrderRepository = shopOrderRepository;
        this.userRepository = userRepository;
        this.apiCacheEntryRepository = apiCacheEntryRepository;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    public Map<String, Object> getDashboardStats() {
        LocalDateTime now = LocalDateTime.now(clock);
        Optional<ApiCacheEntry> cacheEntry = apiCacheEntryRepository.findByCacheKeyAndExpiresAtAfter(CACHE_KEY, now);
        if (cacheEntry.isPresent()) {
            Map<String, Object> cached = deserializePayload(cacheEntry.get().getPayload());
            if (cached != null) {
                return cached;
            }
        }

        Map<String, Object> response = buildDashboardStats(now);
        saveCacheEntry(response, now.plusSeconds(cacheTtlSeconds));
        return response;
    }

    @Scheduled(fixedDelayString = "${app.cache.cleanup-interval-ms:300000}")
    @Transactional
    public void purgeExpiredCacheEntries() {
        apiCacheEntryRepository.deleteByExpiresAtBefore(LocalDateTime.now(clock));
    }

    private Map<String, Object> buildDashboardStats(LocalDateTime now) {
        LocalDateTime thirtyDaysAgo = now.minusDays(30);
        LocalDateTime sixtyDaysAgo = now.minusDays(60);

        long totalBookings = bookingRepository.count();
        long totalUsers = userRepository.countByDeletedFalse();
        long totalOrders = shopOrderRepository.count();

        double totalRevenue = valueOrZero(shopOrderRepository.sumTotalRevenue())
                + valueOrZero(bookingRepository.sumTotalRevenue());

        long currentBookings = bookingRepository.countByCreatedAtBetween(thirtyDaysAgo, now);
        long previousBookings = bookingRepository.countByCreatedAtBetween(sixtyDaysAgo, thirtyDaysAgo);
        double bookingGrowth = calculateGrowth(currentBookings, previousBookings);

        double currentRevenue = valueOrZero(shopOrderRepository.sumRevenueByCreatedAtBetween(thirtyDaysAgo, now))
                + valueOrZero(bookingRepository.sumRevenueByCreatedAtBetween(thirtyDaysAgo, now));
        double previousRevenue = valueOrZero(shopOrderRepository.sumRevenueByCreatedAtBetween(sixtyDaysAgo, thirtyDaysAgo))
                + valueOrZero(bookingRepository.sumRevenueByCreatedAtBetween(sixtyDaysAgo, thirtyDaysAgo));
        double revenueGrowth = calculateGrowth(currentRevenue, previousRevenue);

        long currentUsers = userRepository.countByDeletedFalseAndCreatedAtBetween(thirtyDaysAgo, now);
        long previousUsers = userRepository.countByDeletedFalseAndCreatedAtBetween(sixtyDaysAgo, thirtyDaysAgo);
        double userGrowth = calculateGrowth(currentUsers, previousUsers);

        long currentOrders = shopOrderRepository.countByCreatedAtBetween(thirtyDaysAgo, now);
        long previousOrders = shopOrderRepository.countByCreatedAtBetween(sixtyDaysAgo, thirtyDaysAgo);
        double orderGrowth = calculateGrowth(currentOrders, previousOrders);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalBookings", totalBookings);
        stats.put("bookingGrowth", bookingGrowth);
        stats.put("totalRevenue", totalRevenue);
        stats.put("revenueGrowth", revenueGrowth);
        stats.put("totalUsers", totalUsers);
        stats.put("userGrowth", userGrowth);
        stats.put("totalOrders", totalOrders);
        stats.put("orderGrowth", orderGrowth);

        LocalDateTime sixMonthStart = now.minusMonths(5)
                .withDayOfMonth(1)
                .withHour(0)
                .withMinute(0)
                .withSecond(0)
                .withNano(0);
        LocalDateTime nextMonthStart = now.withDayOfMonth(1)
                .withHour(0)
                .withMinute(0)
                .withSecond(0)
                .withNano(0)
                .plusMonths(1);

        Map<YearMonth, BookingRepository.MonthlyBookingSummary> bookingStatsByMonth = new HashMap<>();
        for (BookingRepository.MonthlyBookingSummary summary :
                bookingRepository.summarizeByMonthBetween(sixMonthStart, nextMonthStart)) {
            bookingStatsByMonth.put(YearMonth.of(summary.getYear(), summary.getMonth()), summary);
        }

        Map<YearMonth, Double> orderRevenueByMonth = new HashMap<>();
        for (ShopOrderRepository.MonthlyOrderRevenueSummary summary :
                shopOrderRepository.summarizeRevenueByMonthBetween(sixMonthStart, nextMonthStart)) {
            orderRevenueByMonth.put(
                    YearMonth.of(summary.getYear(), summary.getMonth()),
                    valueOrZero(summary.getRevenue()));
        }

        List<Map<String, Object>> revenueDataList = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime startOfMonth = now.minusMonths(i)
                    .withDayOfMonth(1)
                    .withHour(0)
                    .withMinute(0)
                    .withSecond(0)
                    .withNano(0);
            YearMonth yearMonth = YearMonth.from(startOfMonth);
            BookingRepository.MonthlyBookingSummary bookingSummary = bookingStatsByMonth.get(yearMonth);

            double monthRevenue = orderRevenueByMonth.getOrDefault(yearMonth, 0.0)
                    + (bookingSummary != null ? valueOrZero(bookingSummary.getRevenue()) : 0.0);
            long monthBookings = bookingSummary != null && bookingSummary.getBookingCount() != null
                    ? bookingSummary.getBookingCount()
                    : 0L;

            Map<String, Object> monthData = new LinkedHashMap<>();
            monthData.put("month", startOfMonth.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
            monthData.put("revenue", monthRevenue);
            monthData.put("bookings", monthBookings);
            revenueDataList.add(monthData);
        }

        List<Booking> latestBookings = bookingRepository.findAll(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).getContent();

        List<Map<String, Object>> recentBookingsList = latestBookings.stream()
                .map(this::toBookingMap)
                .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("stats", stats);
        response.put("revenueData", revenueDataList);
        response.put("recentBookings", recentBookingsList);
        return response;
    }

    @Transactional
    protected void saveCacheEntry(Map<String, Object> response, LocalDateTime expiresAt) {
        ApiCacheEntry cacheEntry = apiCacheEntryRepository.findByCacheKey(CACHE_KEY)
                .orElseGet(ApiCacheEntry::new);
        cacheEntry.setCacheKey(CACHE_KEY);
        cacheEntry.setPayload(serializePayload(response));
        cacheEntry.setExpiresAt(expiresAt);
        apiCacheEntryRepository.save(cacheEntry);
    }

    private String serializePayload(Map<String, Object> response) {
        try {
            return objectMapper.writeValueAsString(response);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize admin dashboard cache payload", exception);
        }
    }

    private Map<String, Object> deserializePayload(String payload) {
        try {
            return objectMapper.readValue(payload, new TypeReference<>() { });
        } catch (JsonProcessingException exception) {
            return null;
        }
    }

    private double calculateGrowth(double current, double previous) {
        if (previous == 0.0) {
            return current > 0.0 ? 100.0 : 0.0;
        }
        return Math.round(((current - previous) / previous) * 100.0 * 10.0) / 10.0;
    }

    private double valueOrZero(Double value) {
        return value != null ? value : 0.0;
    }

    private Map<String, Object> toBookingMap(Booking booking) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", String.valueOf(booking.getId()));
        map.put("userName", booking.getUser() != null ? booking.getUser().getName() : "Anonymous");
        map.put("serviceName", booking.getService() != null ? booking.getService().getName() : "Unknown Service");
        map.put("barberName", booking.getBarber() != null ? booking.getBarber().getName() : "Unknown Barber");
        map.put("date", booking.getDate() != null ? booking.getDate().toString() : "");
        map.put("time", booking.getTime() != null ? booking.getTime().toString() : "");
        map.put("status", booking.getStatus());
        map.put("price", booking.getPrice());
        return map;
    }
}
