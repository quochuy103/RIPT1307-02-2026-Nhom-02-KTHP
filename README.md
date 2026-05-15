# Cutie Cuts

Hệ thống salon full-stack gồm website khách hàng, khu vực quản trị và backend API cho đặt lịch, bán sản phẩm, thanh toán VietQR, quản lý gallery và đánh giá.

## Tổng quan

Cutie Cuts là dự án web cho salon tóc với hai phần chính:

- `frontend/`: website React/Vite cho khách hàng và admin
- `backend/cutie-cuts-app/`: API Spring Boot phục vụ authentication, booking, shop, payment và quản trị dữ liệu

Luồng sử dụng chính của hệ thống:

- Khách hàng đăng ký, đăng nhập hoặc đăng nhập Google
- Xem dịch vụ, barber, gallery, sản phẩm
- Đặt lịch cắt tóc
- Mua sản phẩm và thanh toán bằng VietQR
- Theo dõi trạng thái booking/order
- Admin quản lý users, bookings, services, barbers, products, orders, reviews và gallery

## Tính năng chính

### Khách hàng

- Đăng ký, đăng nhập bằng email/password
- Đăng nhập Google OAuth
- Xem danh sách dịch vụ, barber, gallery và sản phẩm
- Đặt lịch cắt tóc theo ngày, giờ và barber
- Thêm sản phẩm vào giỏ hàng và checkout
- Tạo thanh toán VietQR cho đơn hàng
- Xem và gửi đánh giá

### Quản trị

- Dashboard admin
- Quản lý người dùng
- Quản lý booking
- Quản lý dịch vụ salon
- Quản lý barber
- Quản lý sản phẩm
- Quản lý đơn hàng
- Quản lý gallery
- Quản lý review

### Backend/API

- JWT authentication
- Google OAuth login
- CRUD cho barber, service, product, gallery
- Booking management
- Order management
- VietQR payment + webhook xử lý trạng thái
- Notification API
- Swagger UI để test API
- WebSocket cập nhật trạng thái thanh toán

## Tech Stack

| Layer | Công nghệ |
| --- | --- |
| Frontend | React 18, TypeScript, Vite |
| UI | Tailwind CSS, Radix UI, shadcn/ui, Framer Motion |
| Data fetching | TanStack Query |
| Routing | React Router |
| Form | React Hook Form |
| Backend | Java 17, Spring Boot 3 |
| API docs | springdoc-openapi / Swagger UI |
| Auth | Spring Security, JWT, Google OAuth |
| Database | PostgreSQL 16 |
| Storage | MinIO / S3-compatible storage |
| Payment | VietQR |
| Realtime | Spring WebSocket |
| Testing | JUnit, Spring Boot Test, Vitest, Playwright |
| Container | Docker, Docker Compose |

## Cấu trúc dự án

```text
main-app/
├── backend/
│   ├── init.sql
│   ├── pg_hba.conf
│   └── cutie-cuts-app/
│       ├── src/
│       │   ├── main/java/.../controller
│       │   ├── main/java/.../service
│       │   ├── main/java/.../repository
│       │   ├── main/java/.../entity
│       │   ├── main/java/.../dto
│       │   ├── main/resources/
│       │   └── test/java/
│       ├── Dockerfile
│       ├── docker-compose.yml
│       └── pom.xml
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── pages/admin/
│   │   └── test/
│   ├── Dockerfile
│   └── package.json
├── HOW_TO_TEST_QR_PAYMENT.md
├── PAYMENT_API_TESTING_GUIDE.md
├── PAYMENT_VIETQR_GUIDE.md
└── TROUBLESHOOTING_QR_NULL.md
```

## Các route giao diện nổi bật

### Public

- `/`
- `/services`
- `/shop`
- `/gallery`
- `/about`
- `/contact`
- `/auth`

### Yêu cầu đăng nhập

- `/booking`
- `/checkout`

### Admin

- `/admin`
- `/admin/users`
- `/admin/bookings`
- `/admin/services`
- `/admin/barbers`
- `/admin/products`
- `/admin/orders`
- `/admin/gallery`
- `/admin/reviews`
- `/admin/settings`

## Cách chạy nhanh

### Yêu cầu

- Java 17+
- Maven 3.9+
- Node.js 20+
- PostgreSQL 16
- Docker Desktop

### 1. Chạy backend bằng Docker Compose

```bash
cd backend/cutie-cuts-app
docker compose up -d --build
```

Compose hiện tại khởi động:

- `backend` trên cổng `8081`
- `postgres` trên cổng `5433`
- `minio` trên cổng `9000`
- `minio console` trên cổng `9003`

### 2. Chạy frontend local

```bash
cd frontend
npm install
npm run dev
```

Frontend mặc định chạy trên:

- `http://localhost:8080`

## Truy cập ứng dụng

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:8081`
- Swagger UI: `http://localhost:8081/swagger-ui/index.html`
- PostgreSQL: `localhost:5433`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9003`

## Chạy local không Docker

### Backend

```bash
cd backend/cutie-cuts-app
./mvnw spring-boot:run
```

Backend local mặc định dùng:

- PostgreSQL tại `localhost:5433`
- database `haircut_db`
- port app `8081`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Biến môi trường quan trọng

### Backend

- `SERVER_PORT`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `VIETQR_BANK_ID`
- `VIETQR_ACCOUNT_NO`
- `VIETQR_ACCOUNT_NAME`
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `S3_ENDPOINT`
- `S3_PUBLIC_URL`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `S3_BUCKET_AVATARS`
- `S3_BUCKET_GALLERY`

### Frontend

- `VITE_API_BASE_URL`
- `VITE_GOOGLE_CLIENT_ID`

## API và backend modules

Các controller chính hiện có trong backend:

- `AuthController`
- `BookingController`
- `OrderController`
- `PaymentController`
- `PaymentWebhookController`
- `BarberController`
- `SalonServiceController`
- `ProductController`
- `GalleryController`
- `ReviewController`
- `NotificationController`
- `UserController`
- `UsersController`
- `UserAvatarController`

Swagger UI là điểm vào tốt nhất để xem route và test request thực tế.

## Testing

### Backend

```bash
cd backend/cutie-cuts-app
./mvnw test
```

Hiện tại repo đã có test cho các luồng như:

- `BookingServiceTest`
- `OrderControllerTest`

### Frontend

```bash
cd frontend
npm test
```

Ngoài ra frontend có cấu hình:

- `Vitest`
- `Playwright`

## Docker

### Reset backend stack

```bash
cd backend/cutie-cuts-app
docker compose down -v
docker compose up -d --build
```

### Rebuild backend sau khi sửa mã

```bash
cd backend/cutie-cuts-app
docker compose up -d --build backend
```

## Tài liệu bổ sung trong repo

- [HOW_TO_TEST_QR_PAYMENT.md](HOW_TO_TEST_QR_PAYMENT.md)
- [PAYMENT_API_TESTING_GUIDE.md](PAYMENT_API_TESTING_GUIDE.md)
- [PAYMENT_VIETQR_GUIDE.md](PAYMENT_VIETQR_GUIDE.md)
- [TROUBLESHOOTING_QR_NULL.md](TROUBLESHOOTING_QR_NULL.md)
- [HOW_TO_UPDATE_PRODUCT_PRICES.md](HOW_TO_UPDATE_PRODUCT_PRICES.md)

## Ghi chú hiện trạng dự án

- Dự án đã có cả frontend và backend, không còn là backend-only
- Frontend đã có khu vực public và admin
- Thanh toán VietQR và webhook đã được tích hợp
- Swagger có thể dùng để test trực tiếp các API đang chạy
- Backend đang dùng PostgreSQL và MinIO qua Docker Compose

## Team

Cutie Cuts được phát triển như một dự án web salon full-stack phục vụ đặt lịch, thương mại điện tử và quản trị nội dung.
