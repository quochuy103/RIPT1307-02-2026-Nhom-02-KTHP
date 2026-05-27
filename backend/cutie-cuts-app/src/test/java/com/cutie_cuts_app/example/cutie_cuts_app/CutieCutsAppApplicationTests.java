package com.cutie_cuts_app.example.cutie_cuts_app;

import com.cutie_cuts_app.example.cutie_cuts_app.repository.BarberRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.BookingRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.GalleryImageRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.NotificationRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.PaymentRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.PaymentTransactionRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ProductRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ReviewRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.RevokedTokenRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.SalonServiceRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ShopOrderRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserAuthRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

@SpringBootTest(properties = {
		"spring.autoconfigure.exclude="
				+ "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,"
				+ "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration,"
				+ "org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration"
})
class CutieCutsAppApplicationTests {

	@MockBean
	private BarberRepository barberRepository;

	@MockBean
	private BookingRepository bookingRepository;

	@MockBean
	private GalleryImageRepository galleryImageRepository;

	@MockBean
	private NotificationRepository notificationRepository;

	@MockBean
	private PaymentRepository paymentRepository;

	@MockBean
	private PaymentTransactionRepository paymentTransactionRepository;

	@MockBean
	private ProductRepository productRepository;

	@MockBean
	private ReviewRepository reviewRepository;

	@MockBean
	private RevokedTokenRepository revokedTokenRepository;

	@MockBean
	private SalonServiceRepository salonServiceRepository;

	@MockBean
	private ShopOrderRepository shopOrderRepository;

	@MockBean
	private UserAuthRepository userAuthRepository;

	@MockBean
	private UserRepository userRepository;

	@Test
	void contextLoads() {
	}

}
