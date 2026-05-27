package com.cutie_cuts_app.example.cutie_cuts_app.config;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.*;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seedData(
            SalonServiceRepository salonServiceRepository,
            BarberRepository barberRepository,
            ProductRepository productRepository,
            GalleryImageRepository galleryImageRepository,
            UserRepository userRepository,
            UserAuthRepository userAuthRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            syncSalonServices(salonServiceRepository);

            if (barberRepository.count() == 0) {
                Barber b1 = new Barber();
                b1.setName("Marcus Cole");
                b1.setRole("Master Barber");
                b1.setImage("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400");
                b1.setExperience(12);
                b1.setSpecialties("Fades,Classic Cuts");
                b1.setRating(4.9);

                Barber b2 = new Barber();
                b2.setName("Jake Rivera");
                b2.setRole("Senior Barber");
                b2.setImage("https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400");
                b2.setExperience(8);
                b2.setSpecialties("Beard Design,Hot Shaves");
                b2.setRating(4.8);

                barberRepository.saveAll(List.of(b1, b2));
            }

            if (productRepository.count() == 0) {
                Product p1 = new Product();
                p1.setName("Premium Hair Wax");
                p1.setPrice(150000.0);
                p1.setImage("https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=400");
                p1.setCategory("Styling");
                p1.setDescription("Strong hold matte finish wax");
                p1.setRating(4.7);
                p1.setStock(50);

                Product p2 = new Product();
                p2.setName("Beard Oil");
                p2.setPrice(22.99);
                p2.setImage("https://images.unsplash.com/photo-1621607512214-68297480165e?w=400");
                p2.setCategory("Beard Care");
                p2.setDescription("Nourishing beard oil with argan");
                p2.setRating(4.8);
                p2.setStock(40);

                productRepository.saveAll(List.of(p1, p2));
            }

            if (galleryImageRepository.count() == 0) {
                GalleryImage g1 = new GalleryImage();
                g1.setUrl("https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600");
                g1.setAlt("Classic fade haircut");
                g1.setCategory("fade");

                GalleryImage g2 = new GalleryImage();
                g2.setUrl("https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600");
                g2.setAlt("Modern textured crop");
                g2.setCategory("modern");

                galleryImageRepository.saveAll(List.of(g1, g2));
            }

            if (userAuthRepository.findByAuthTypeAndAuthValue("email", "admin@cutiecuts.com").isEmpty()) {
                User admin = new User();
                admin.setName("Admin");
                admin.setRole("ADMIN");
                userRepository.save(admin);

                UserAuth auth = new UserAuth();
                auth.setUser(admin);
                auth.setAuthType("email");
                auth.setAuthValue("admin@cutiecuts.com");
                auth.setPasswordHash(passwordEncoder.encode("123456"));
                auth.setEmailVerified(true);
                userAuthRepository.save(auth);
            }

            if (userAuthRepository.findByAuthTypeAndAuthValue("email", "user@cutiecuts.com").isEmpty()) {
                User user = new User();
                user.setName("Test User");
                user.setRole("USER");
                userRepository.save(user);

                UserAuth auth = new UserAuth();
                auth.setUser(user);
                auth.setAuthType("email");
                auth.setAuthValue("user@cutiecuts.com");
                auth.setPasswordHash(passwordEncoder.encode("123456"));
                auth.setEmailVerified(true);
                userAuthRepository.save(auth);
            }
        };
    }

    private void syncSalonServices(SalonServiceRepository salonServiceRepository) {
        Set<String> legacySampleNames = Set.of("Skin Fade", "Beard Trim", "Hair Coloring");
        List<SalonService> existingServices = salonServiceRepository.findAll();

        existingServices.stream()
                .filter(service -> legacySampleNames.contains(service.getName()))
                .forEach(service -> {
                    service.setDeleted(true);
                    service.setDeletedAt(LocalDateTime.now());
                });

        Map<String, SalonService> existingByName = existingServices.stream()
                .filter(service -> !legacySampleNames.contains(service.getName()))
                .collect(Collectors.toMap(SalonService::getName, Function.identity(), (first, ignored) -> first));

        List<SalonService> syncedServices = liHeServices().stream()
                .map(seed -> {
                    SalonService service = existingByName.getOrDefault(seed.getName(), new SalonService());
                    service.setName(seed.getName());
                    service.setPrice(seed.getPrice());
                    service.setDisplayPrice(seed.getDisplayPrice());
                    service.setDescription(seed.getDescription());
                    service.setDuration(seed.getDuration());
                    service.setCategory(seed.getCategory());
                    service.setDeleted(false);
                    service.setDeletedAt(null);
                    return service;
                })
                .collect(Collectors.toList());

        salonServiceRepository.saveAll(existingServices);
        salonServiceRepository.saveAll(syncedServices);
    }

    private List<SalonService> liHeServices() {
        return List.of(
                service("Cắt Tóc Học Sinh", 60000, "60.000đ", "Dịch vụ cắt tóc chuyên nghiệp, tạo kiểu thời trang dành riêng cho các bạn học sinh.", 30, "haircut"),
                service("Cắt Tóc Sinh Viên & Người Lớn", 70000, "70.000đ", "Tư vấn và cắt tạo kiểu tóc phù hợp nhất với khuôn mặt dành cho sinh viên và người đi làm.", 30, "haircut"),
                service("Cắt Kéo Chuyên Sâu", 85000, "80.000đ - 90.000đ", "Kỹ thuật cắt phom tóc hoàn toàn bằng kéo, giúp tóc giữ nếp tự nhiên, mềm mại và bền dáng.", 40, "haircut"),
                service("Gội Sau Khi Cắt", 10000, "10.000đ", "Xả gội và sấy sạch tóc con bám dính sau khi cắt, giúp bạn thoải mái tiếp tục công việc.", 5, "haircut"),
                service("Combo Wow Handsome", 119000, "119.000đ", "Gói combo chuẩn nam thần bao gồm các bước: Cắt tóc tạo kiểu, gội đầu sạch sâu và massage thư giãn đầu mặt cơ bản.", 45, "haircut"),
                service("Uốn Thường", 300000, "300.000đ", "Uốn lạnh tạo độ phồng phom tóc, định hình nếp tóc cơ bản giúp dễ dàng vuốt sấy tại nhà.", 60, "styling"),
                service("Uốn Ruffled", 400000, "400.000đ", "Kỹ thuật uốn kết cấu rối châu Âu cá tính, phong cách hiện đại độc đáo và cực kỳ năng động.", 90, "styling"),
                service("Ép Side Tóc", 200000, "150.000đ - 300.000đ", "Ép định hình phần tóc mai và sau gáy ôm sát da đầu, xử lý triệt để tình trạng tóc bung chĩa.", 45, "styling"),
                service("Nhuộm Thường", 300000, "300.000đ", "Nhuộm phủ đều các tông màu thời trang cơ bản, sử dụng thuốc nhuộm chất lượng cao bền màu và giữ bóng.", 60, "coloring"),
                service("Tẩy Tóc (1 lần)", 200000, "200.000đ", "Nâng nền tóc bằng thuốc tẩy cao cấp giảm xơ rối, chuẩn bị cho các tông màu nhuộm sáng, màu khói hoặc pastel.", 45, "coloring"),
                service("Gội Đầu Siêu Thư Giãn", 60000, "60.000đ", "Gói gội xả kết hợp massage mặt cơ bản, bấm huyệt đầu giải tỏa căng thẳng và sấy tạo kiểu tóc.", 30, "care"),
                service("Gội Đầu Dưỡng Sinh", 150000, "150.000đ", "Liệu trình chuyên sâu 60 phút: Gội đầu hai nước sạch sâu, rửa mặt, massage mặt chuyên sâu, massage cổ vai gáy giảm đau mỏi, bấm huyệt trị liệu và sấy tóc.", 60, "care"),
                service("Tẩy Tế Bào Chết Da Mặt", 30000, "30.000đ", "Làm sạch sâu bụi bẩn, loại bỏ bã nhờn tích tụ trên da mặt kết hợp massage thư giãn nhẹ nhàng.", 15, "care"),
                service("Đắp Mặt Nạ Dưỡng Da", 30000, "30.000đ", "Cung cấp độ ẩm dồi dào và dưỡng chất làm dịu, sáng da, đi kèm các bước massage thư giãn các cơ cơ mặt.", 15, "care"),
                service("Tẩy Tế Bào Chết Da Đầu", 30000, "30.000đ", "Làm sạch vảy gàu dư thừa, thông thoáng nang tóc, ngăn ngừa nấm ngứa da đầu kèm massage kích thích mọc tóc.", 15, "care"),
                service("Combo Đẹp Tryyy (Lại còn dài)", 199000, "199.000đ", "Gói chăm sóc phục hồi toàn diện cao cấp: Cắt tóc, rửa mặt sạch sâu, tẩy da chết mặt, massage mặt chuyên sâu, massage giảm mỏi cổ vai gáy và ấn huyệt đầu.", 75, "care")
        );
    }

    private SalonService service(String name, Integer price, String displayPrice, String description, Integer duration, String category) {
        SalonService service = new SalonService();
        service.setName(name);
        service.setPrice(price);
        service.setDisplayPrice(displayPrice);
        service.setDescription(description);
        service.setDuration(duration);
        service.setCategory(category);
        return service;
    }
}
