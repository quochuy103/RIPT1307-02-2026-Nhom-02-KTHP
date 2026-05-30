package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.ApiCacheEntry;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Barber;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Booking;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.SalonService;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ApiCacheEntryRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.BookingRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ShopOrderRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminDashboardServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ShopOrderRepository shopOrderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ApiCacheEntryRepository apiCacheEntryRepository;

    private AdminDashboardService adminDashboardService;
    private Clock fixedClock;

    @BeforeEach
    void setUp() {
        fixedClock = Clock.fixed(Instant.parse("2026-05-31T04:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"));
        adminDashboardService = new AdminDashboardService(
                bookingRepository,
                shopOrderRepository,
                userRepository,
                apiCacheEntryRepository,
                new ObjectMapper(),
                fixedClock);
        ReflectionTestUtils.setField(adminDashboardService, "cacheTtlSeconds", 60L);
    }

    @Test
    void getDashboardStatsReturnsCachedPayloadWhenEntryIsStillFresh() {
        ApiCacheEntry cacheEntry = new ApiCacheEntry();
        cacheEntry.setCacheKey("admin-dashboard:v1");
        cacheEntry.setPayload("""
                {"stats":{"totalBookings":12},"revenueData":[],"recentBookings":[]}
                """);
        cacheEntry.setExpiresAt(LocalDateTime.ofInstant(fixedClock.instant(), fixedClock.getZone()).plusSeconds(30));

        when(apiCacheEntryRepository.findByCacheKeyAndExpiresAtAfter(eq("admin-dashboard:v1"), any(LocalDateTime.class)))
                .thenReturn(Optional.of(cacheEntry));

        Map<String, Object> response = adminDashboardService.getDashboardStats();

        assertNotNull(response);
        assertEquals(12, ((Number) ((Map<?, ?>) response.get("stats")).get("totalBookings")).intValue());
        verify(apiCacheEntryRepository, never()).save(any(ApiCacheEntry.class));
        verifyNoInteractions(bookingRepository, shopOrderRepository, userRepository);
    }

    @Test
    void getDashboardStatsBuildsAndPersistsPayloadWhenCacheMisses() {
        when(apiCacheEntryRepository.findByCacheKeyAndExpiresAtAfter(eq("admin-dashboard:v1"), any(LocalDateTime.class)))
                .thenReturn(Optional.empty());
        when(apiCacheEntryRepository.findByCacheKey("admin-dashboard:v1"))
                .thenReturn(Optional.empty());
        when(bookingRepository.count()).thenReturn(20L);
        when(userRepository.countByDeletedFalse()).thenReturn(8L);
        when(shopOrderRepository.count()).thenReturn(11L);
        when(shopOrderRepository.sumTotalRevenue()).thenReturn(250.0);
        when(bookingRepository.sumTotalRevenue()).thenReturn(50.0);
        when(bookingRepository.countByCreatedAtBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(5L, 4L);
        when(shopOrderRepository.sumRevenueByCreatedAtBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(120.0, 80.0);
        when(bookingRepository.sumRevenueByCreatedAtBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(30.0, 20.0);
        when(userRepository.countByDeletedFalseAndCreatedAtBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(3L, 2L);
        when(shopOrderRepository.countByCreatedAtBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(7L, 6L);
        when(bookingRepository.summarizeByMonthBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(monthlyBookingSummary(2026, 5, 4L, 60.0)));
        when(shopOrderRepository.summarizeRevenueByMonthBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(monthlyOrderRevenueSummary(2026, 5, 90.0)));
        when(bookingRepository.findAll(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(createBooking(1L))));

        Map<String, Object> response = adminDashboardService.getDashboardStats();

        assertEquals(300.0, ((Number) ((Map<?, ?>) response.get("stats")).get("totalRevenue")).doubleValue());
        assertEquals(1, ((List<?>) response.get("recentBookings")).size());

        ArgumentCaptor<ApiCacheEntry> cacheEntryCaptor = ArgumentCaptor.forClass(ApiCacheEntry.class);
        verify(apiCacheEntryRepository).save(cacheEntryCaptor.capture());
        assertEquals("admin-dashboard:v1", cacheEntryCaptor.getValue().getCacheKey());
        assertNotNull(cacheEntryCaptor.getValue().getPayload());
    }

    @Test
    void purgeExpiredCacheEntriesDeletesEntriesOlderThanNow() {
        adminDashboardService.purgeExpiredCacheEntries();

        verify(apiCacheEntryRepository)
                .deleteByExpiresAtBefore(LocalDateTime.ofInstant(fixedClock.instant(), fixedClock.getZone()));
    }

    private BookingRepository.MonthlyBookingSummary monthlyBookingSummary(int year, int month, long count, double revenue) {
        return new BookingRepository.MonthlyBookingSummary() {
            @Override
            public Integer getYear() {
                return year;
            }

            @Override
            public Integer getMonth() {
                return month;
            }

            @Override
            public Long getBookingCount() {
                return count;
            }

            @Override
            public Double getRevenue() {
                return revenue;
            }
        };
    }

    private ShopOrderRepository.MonthlyOrderRevenueSummary monthlyOrderRevenueSummary(int year, int month, double revenue) {
        return new ShopOrderRepository.MonthlyOrderRevenueSummary() {
            @Override
            public Integer getYear() {
                return year;
            }

            @Override
            public Integer getMonth() {
                return month;
            }

            @Override
            public Double getRevenue() {
                return revenue;
            }
        };
    }

    private Booking createBooking(Long id) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", 1L);
        user.setName("Cache User");

        Barber barber = new Barber();
        ReflectionTestUtils.setField(barber, "id", 2L);
        barber.setName("Barber A");

        SalonService service = new SalonService();
        service.setId(3L);
        service.setName("Haircut");

        Booking booking = new Booking();
        ReflectionTestUtils.setField(booking, "id", id);
        booking.setUser(user);
        booking.setBarber(barber);
        booking.setService(service);
        booking.setDate(LocalDate.of(2026, 5, 31));
        booking.setTime(LocalTime.of(14, 0));
        booking.setStatus("done");
        booking.setPrice(150.0);
        return booking;
    }
}
