package com.cutie_cuts_app.example.cutie_cuts_app.config;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.*;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

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
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            if (salonServiceRepository.count() == 0) {
                SalonService s1 = new SalonService();
                s1.setName("Skin Fade");
                s1.setDescription("Clean skin fade with sharp lines");
                s1.setPrice(35);
                s1.setDuration(45);
                s1.setCategory("haircut");

                SalonService s2 = new SalonService();
                s2.setName("Beard Trim");
                s2.setDescription("Professional beard shaping");
                s2.setPrice(20);
                s2.setDuration(20);
                s2.setCategory("grooming");

                SalonService s3 = new SalonService();
                s3.setName("Hair Coloring");
                s3.setDescription("Full hair coloring service");
                s3.setPrice(60);
                s3.setDuration(90);
                s3.setCategory("coloring");

                salonServiceRepository.saveAll(List.of(s1, s2, s3));
            }

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
                p1.setPrice(24.99);
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
                auth.setVerified(true);
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
                auth.setVerified(true);
                userAuthRepository.save(auth);
            }
        };
    }
}
