# Hướng dẫn Test Payment API trên Swagger UI

## 🚀 Bước 1: Khởi động Backend

```bash
cd backend/cutie-cuts-app
mvn spring-boot:run
```

Hoặc nếu dùng Docker:
```bash
docker-compose up
```

Backend sẽ chạy tại: `http://localhost:8081`

---

## 📖 Bước 2: Truy cập Swagger UI

Mở trình duyệt và truy cập:
```
http://localhost:8081/swagger-ui/index.html
```

Bạn sẽ thấy giao diện Swagger với tất cả API endpoints.

---

## 🔐 Bước 3: Lấy JWT Token (Authentication)

### 3.1. Đăng ký tài khoản (nếu chưa có)

1. Tìm endpoint: **POST /auth/register**
2. Click **"Try it out"**
3. Nhập request body:
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "phone": "0123456789"
}
```
4. Click **"Execute"**
5. Lưu lại `token` từ response

### 3.2. Đăng nhập (nếu đã có tài khoản)

1. Tìm endpoint: **POST /auth/login**
2. Click **"Try it out"**
3. Nhập request body:
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```
4. Click **"Execute"**
5. Copy `token` từ response

### 3.3. Authorize với JWT Token

1. Click nút **"Authorize"** ở góc trên bên phải (biểu tượng ổ khóa)
2. Nhập token vào ô **"Value"**: `Bearer YOUR_TOKEN_HERE`
   - Ví dụ: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Click **"Authorize"**
4. Click **"Close"**

---

## 🛒 Bước 4: Tạo Order (Đơn hàng)

Trước khi test payment, cần có order ID.

1. Tìm endpoint: **POST /orders**
2. Click **"Try it out"**
3. Nhập request body:
```json
{
  "address": "123 Nguyen Hue, District 1, HCMC",
  "items": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 2,
      "quantity": 1
    }
  ]
}
```
4. Click **"Execute"**
5. **Lưu lại `id` từ response** (ví dụ: `id: 5`)

---

## 💳 Bước 5: Test Payment APIs

### 5.1. Tạo Payment (Generate QR Code)

1. Tìm section: **Payment** trong Swagger
2. Tìm endpoint: **POST /api/payments**
3. Click **"Try it out"**
4. Nhập request body:
```json
{
  "orderId": 5
}
```
   *(Thay `5` bằng order ID bạn vừa tạo)*

5. Click **"Execute"**

**Response mẫu:**
```json
{
  "paymentCode": "PAY20260511001",
  "qrDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "qrCodeUrl": "https://img.vietqr.io/image/...",
  "amount": 150000,
  "bankName": "Vietcombank",
  "bankAccount": "1234567890",
  "expiredAt": "2026-05-11T01:15:00",
  "status": "PENDING"
}
```

6. **Lưu lại `paymentCode`** để test các API khác

### 5.2. Xem QR Code

- Copy `qrDataUrl` hoặc `qrCodeUrl` từ response
- Paste vào trình duyệt để xem QR code
- Hoặc dùng app ngân hàng quét mã QR này để thanh toán

### 5.3. Kiểm tra trạng thái Payment

1. Tìm endpoint: **GET /api/payments/{paymentCode}**
2. Click **"Try it out"**
3. Nhập `paymentCode` vào ô **paymentCode** (ví dụ: `PAY20260511001`)
4. Click **"Execute"**

**Response:**
```json
{
  "paymentCode": "PAY20260511001",
  "amount": 150000,
  "status": "PENDING",
  "qrDataUrl": "...",
  "bankName": "Vietcombank",
  "expiredAt": "2026-05-11T01:15:00"
}
```

### 5.4. Xem danh sách Payments của user

1. Tìm endpoint: **GET /api/payments/my-payments**
2. Click **"Try it out"**
3. Click **"Execute"**

**Response:** Danh sách tất cả payments của user hiện tại

---

## 🔔 Bước 6: Test Webhook (Mô phỏng thanh toán thành công)

Webhook thường được gọi bởi ngân hàng khi user thanh toán. Để test, bạn có thể mô phỏng:

1. Tìm endpoint: **POST /api/webhooks/payment**
2. Click **"Try it out"**
3. Nhập request body:
```json
{
  "paymentCode": "PAY20260511001",
  "transactionId": "VCB20260511123456",
  "amount": 150000,
  "status": "SUCCESS",
  "bankCode": "VCB",
  "transactionDate": "2026-05-11T01:10:00"
}
```
   *(Thay `paymentCode` bằng mã payment bạn vừa tạo)*

4. Click **"Execute"**

**Response:**
```json
{
  "success": true,
  "message": "Payment processed successfully"
}
```

5. Sau đó gọi lại **GET /api/payments/{paymentCode}** để xem status đã chuyển sang `COMPLETED`

---

## 📊 Các Status của Payment

| Status | Ý nghĩa |
|--------|---------|
| `PENDING` | Đang chờ thanh toán |
| `COMPLETED` | Thanh toán thành công |
| `FAILED` | Thanh toán thất bại |
| `EXPIRED` | Hết hạn thanh toán (sau 15 phút) |
| `CANCELLED` | Đã hủy |

---

## 🐛 Troubleshooting

### Lỗi 401 Unauthorized
- Kiểm tra JWT token đã được authorize chưa
- Token có thể đã hết hạn, đăng nhập lại để lấy token mới

### Lỗi 404 Not Found
- Kiểm tra `orderId` hoặc `paymentCode` có đúng không
- Order phải thuộc về user hiện tại

### Lỗi 500 Internal Server Error
- Kiểm tra VietQR credentials trong `.env`:
  - `VIETQR_CLIENT_ID`
  - `VIETQR_API_KEY`
  - `BANK_BIN`
  - `BANK_ACCOUNT_NO`
- Xem logs trong console để biết chi tiết lỗi

### QR Code không hiển thị
- Kiểm tra VietQR API có hoạt động không
- Thử dùng `qrCodeUrl` thay vì `qrDataUrl`

---

## 🎯 Flow Test Hoàn Chỉnh

```
1. POST /auth/login → Lấy JWT token
2. Authorize với token
3. POST /orders → Tạo order, lấy orderId
4. POST /api/payments → Tạo payment với orderId, lấy paymentCode
5. Xem QR code từ response
6. POST /api/webhooks/payment → Mô phỏng thanh toán thành công
7. GET /api/payments/{paymentCode} → Verify status = COMPLETED
8. GET /api/payments/my-payments → Xem tất cả payments
```

---

## 📝 Notes

- Payment sẽ tự động expire sau 15 phút
- Mỗi order chỉ có thể tạo 1 payment PENDING tại một thời điểm
- Webhook endpoint không cần authentication (để ngân hàng có thể gọi)
- Trong production, cần verify webhook signature từ ngân hàng

---

## 🔗 Useful Links

- Swagger UI: http://localhost:8081/swagger-ui/index.html
- API Docs: http://localhost:8081/v3/api-docs
- VietQR Documentation: https://www.vietqr.io/docs
