package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.Booking;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.BookingRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ShopOrderRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;

@RestController
@RequestMapping("/api/admin/dashboard")
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:5173"})
public class AdminDashboardController {

    private final BookingRepository bookingRepository;
    private final ShopOrderRepository shopOrderRepository;
    private final UserRepository userRepository;

    public AdminDashboardController(
            BookingRepository bookingRepository,
            ShopOrderRepository shopOrderRepository,
            UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.shopOrderRepository = shopOrderRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public Map<String, Object> getDashboardStats(Authentication authentication) {
        if (authentication == null || !isAdmin(authentication)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied. Admin role required.");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thirtyDaysAgo = now.minusDays(30);
        LocalDateTime sixtyDaysAgo = now.minusDays(60);

        // 1. Total Counts
        long totalBookings = bookingRepository.count();
        long totalUsers = userRepository.countByDeletedFalse();
        long totalOrders = shopOrderRepository.count();

        Double totalOrderRev = shopOrderRepository.sumTotalRevenue();
        Double totalBookRev = bookingRepository.sumTotalRevenue();
        double totalRevenue = (totalOrderRev != null ? totalOrderRev : 0.0) + (totalBookRev != null ? totalBookRev : 0.0);

        // 2. Growth Rates (Compare last 30 days vs 30 days before that)
        long currentBookings = bookingRepository.countByCreatedAtBetween(thirtyDaysAgo, now);
        long previousBookings = bookingRepository.countByCreatedAtBetween(sixtyDaysAgo, thirtyDaysAgo);
        double bookingGrowth = calculateGrowth(currentBookings, previousBookings);

        Double currentOrderRev = shopOrderRepository.sumRevenueByCreatedAtBetween(thirtyDaysAgo, now);
        Double prevOrderRev = shopOrderRepository.sumRevenueByCreatedAtBetween(sixtyDaysAgo, thirtyDaysAgo);
        Double currentBookRev = bookingRepository.sumRevenueByCreatedAtBetween(thirtyDaysAgo, now);
        Double prevBookRev = bookingRepository.sumRevenueByCreatedAtBetween(sixtyDaysAgo, thirtyDaysAgo);

        double currentRevenue = (currentOrderRev != null ? currentOrderRev : 0.0) + (currentBookRev != null ? currentBookRev : 0.0);
        double previousRevenue = (prevOrderRev != null ? prevOrderRev : 0.0) + (prevBookRev != null ? prevBookRev : 0.0);
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

        // 3. Revenue & Booking Trends Over the Last 6 Months
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
        for (BookingRepository.MonthlyBookingSummary summary : bookingRepository.summarizeByMonthBetween(sixMonthStart, nextMonthStart)) {
            bookingStatsByMonth.put(YearMonth.of(summary.getYear(), summary.getMonth()), summary);
        }

        Map<YearMonth, Double> orderRevenueByMonth = new HashMap<>();
        for (ShopOrderRepository.MonthlyOrderRevenueSummary summary : shopOrderRepository.summarizeRevenueByMonthBetween(sixMonthStart, nextMonthStart)) {
            orderRevenueByMonth.put(YearMonth.of(summary.getYear(), summary.getMonth()),
                    summary.getRevenue() != null ? summary.getRevenue() : 0.0);
        }

        List<Map<String, Object>> revenueDataList = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime startOfMonth = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
            YearMonth yearMonth = YearMonth.from(startOfMonth);
            BookingRepository.MonthlyBookingSummary bookingSummary = bookingStatsByMonth.get(yearMonth);

            double orderRev = orderRevenueByMonth.getOrDefault(yearMonth, 0.0);
            double bookRev = bookingSummary != null && bookingSummary.getRevenue() != null
                    ? bookingSummary.getRevenue()
                    : 0.0;
            double monthRev = orderRev + bookRev;

            long monthBookings = bookingSummary != null && bookingSummary.getBookingCount() != null
                    ? bookingSummary.getBookingCount()
                    : 0L;

            String monthName = startOfMonth.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);

            Map<String, Object> monthData = new LinkedHashMap<>();
            monthData.put("month", monthName);
            monthData.put("revenue", monthRev);
            monthData.put("bookings", monthBookings);
            revenueDataList.add(monthData);
        }

        // 4. Recent Bookings (5 latest bookings)
        List<Booking> latestBookings = bookingRepository.findAll(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).getContent();

        List<Map<String, Object>> recentBookingsList = latestBookings.stream().map(this::toBookingMap).toList();

        // 5. Build Response
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("stats", stats);
        response.put("revenueData", revenueDataList);
        response.put("recentBookings", recentBookingsList);

        return response;
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private double calculateGrowth(double current, double previous) {
        if (previous == 0.0) {
            return current > 0.0 ? 100.0 : 0.0;
        }
        return Math.round(((current - previous) / previous) * 100.0 * 10.0) / 10.0;
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
