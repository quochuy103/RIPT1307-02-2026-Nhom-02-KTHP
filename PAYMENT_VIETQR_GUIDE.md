# Hướng Dẫn Tích Hợp Thanh Toán VietQR

## 📋 Tổng Quan

Tính năng thanh toán VietQR cho phép khách hàng thanh toán đơn hàng bằng cách quét mã QR qua ứng dụng ngân hàng. Hệ thống tự động xác nhận thanh toán và cập nhật trạng thái đơn hàng real-time qua WebSocket.

## 🏗️ Kiến Trúc Hệ Thống

### Backend Components

1. **Entities**
   - `Payment`: Lưu thông tin thanh toán
   - `PaymentTransaction`: Lưu lịch sử giao dịch từ ngân hàng

2. **Services**
   - `VietQRService`: Tạo mã QR thanh toán
   - `PaymentService`: Quản lý payment lifecycle
   - `PaymentWebhookService`: Xử lý callback từ ngân hàng

3. **Controllers**
   - `PaymentController`: API cho client
   - `PaymentWebhookController`: Nhận webhook từ ngân hàng

4. **WebSocket**
   - Real-time notification khi thanh toán thành công
   - Endpoint: `/ws/payment`
   - Topic: `/topic/payment/{paymentCode}`

## 🔧 Cấu Hình

### 1. Environment Variables (.env)

```env
# VietQR Configuration
VIETQR_BANK_ID=970422
VIETQR_ACCOUNT_NO=0123456789
VIETQR_ACCOUNT_NAME=CUTIE CUTS SALON
```

### 2. Application Properties

Đã được cấu hình trong `application.properties`:
```properties
vietqr.api.url=https://api.vietqr.io/v2
vietqr.bank.id=${VIETQR_BANK_ID:970422}
vietqr.account.no=${VIETQR_ACCOUNT_NO:0123456789}
vietqr.account.name=${VIETQR_ACCOUNT_NAME:CUTIE CUTS SALON}
vietqr.template=compact
```

### 3. Database Schema

Tables được tạo tự động qua `schema.sql`:
- `payments`: Thông tin thanh toán
- `payment_transactions`: Lịch sử giao dịch

## 📡 API Endpoints

### 1. Tạo Payment

```http
POST /api/payments
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": 123
}
```

**Response:**
```json
{
  "id": 1,
  "paymentCode": "CUTIE20260511000001",
  "orderId": 123,
  "amount": 150000.00,
  "status": "PENDING",
  "qrCodeUrl": "https://img.vietqr.io/image/...",
  "qrDataUrl": "data:image/png;base64,...",
  "bankAccount": "0123456789",
  "bankCode": "970422",
  "bankName": "MB Bank",
  "expiredAt": "2026-05-11T00:05:00",
  "createdAt": "2026-05-11T00:00:00"
}
```

### 2. Lấy Thông Tin Payment

```http
GET /api/payments/{paymentCode}
Authorization: Bearer {token}
```

### 3. Lấy Danh Sách Payment Của User

```http
GET /api/payments/my-payments
Authorization: Bearer {token}
```

### 4. Webhook (Cho Ngân Hàng)

```http
POST /api/webhooks/payment
Content-Type: application/json

{
  "paymentCode": "CUTIE20260511000001",
  "transactionCode": "FT26051100001",
  "amount": 150000.00,
  "bankCode": "970422",
  "transactionDate": "2026-05-11T00:03:00",
  "description": "CUTIE20260511000001"
}
```

## 🔌 WebSocket Integration

### Connect to WebSocket

```javascript
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

const socket = new SockJS('http://localhost:8081/ws/payment');
const stompClient = Stomp.over(socket);

stompClient.connect({}, () => {
  // Subscribe to payment updates
  stompClient.subscribe(`/topic/payment/${paymentCode}`, (message) => {
    const update = JSON.parse(message.body);
    console.log('Payment status:', update);
    // { paymentCode, status, message }
  });
});
```

## 🎯 Flow Thanh Toán

### 1. Client Flow

```
1. User chọn đơn hàng cần thanh toán
2. Client gọi POST /api/payments với orderId
3. Backend tạo payment và trả về QR code
4. Client hiển thị QR code cho user
5. Client kết nối WebSocket để lắng nghe cập nhật
6. User quét QR và thanh toán qua app ngân hàng
7. Ngân hàng gửi webhook đến backend
8. Backend xử lý và gửi notification qua WebSocket
9. Client nhận notification và cập nhật UI
10. Chuyển user đến trang success
```

### 2. Backend Flow

```
1. Nhận request tạo payment
2. Validate order và user
3. Generate payment code (CUTIE + timestamp + random)
4. Gọi VietQR API để tạo QR code
5. Lưu payment vào database
6. Trả về payment info cho client

--- Khi nhận webhook ---

7. Validate payment code và amount
8. Tạo payment transaction
9. Cập nhật payment status = COMPLETED
10. Cập nhật order status = paid
11. Gửi notification qua WebSocket
```

## 🔐 Security

### 1. Authentication
- Tất cả payment endpoints yêu cầu JWT token
- Webhook endpoint public (cho ngân hàng)

### 2. Validation
- Kiểm tra ownership: User chỉ tạo payment cho order của mình
- Kiểm tra amount: So sánh số tiền webhook với payment
- Kiểm tra status: Không xử lý payment đã completed
- Kiểm tra expiry: Payment tự động expire sau 5 phút

### 3. Idempotency
- Payment code unique
- Không xử lý duplicate webhook

## 🧪 Testing

### 1. Test Tạo Payment

```bash
curl -X POST http://localhost:8081/api/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId": 1}'
```

### 2. Test Webhook (Simulate Bank Callback)

```bash
curl -X POST http://localhost:8081/api/webhooks/payment \
  -H "Content-Type: application/json" \
  -d '{
    "paymentCode": "CUTIE20260511000001",
    "transactionCode": "FT26051100001",
    "amount": 150000.00,
    "bankCode": "970422",
    "transactionDate": "2026-05-11T00:03:00",
    "description": "CUTIE20260511000001"
  }'
```

## 📱 Frontend Integration (Sẽ Implement)

### Dependencies Cần Thiết

```json
{
  "dependencies": {
    "sockjs-client": "^1.6.1",
    "@stomp/stompjs": "^7.0.0"
  }
}
```

### Component Structure

```
src/
  pages/
    PaymentPage.tsx          # Trang thanh toán chính
  components/
    payment/
      QRCodeDisplay.tsx      # Hiển thị QR code
      PaymentStatus.tsx      # Trạng thái thanh toán
      PaymentTimer.tsx       # Đếm ngược thời gian
  hooks/
    usePaymentWebSocket.ts   # WebSocket hook
  services/
    paymentService.ts        # API calls
```

## 🎨 UI/UX Recommendations

### Payment Page Layout

1. **Header**: Thông tin đơn hàng và số tiền
2. **QR Code**: Hiển thị to, rõ ràng
3. **Instructions**: Hướng dẫn quét mã
4. **Bank Info**: Số tài khoản, tên ngân hàng (backup)
5. **Timer**: Countdown 5 phút
6. **Status**: Real-time status updates

### States

- **Loading**: Đang tạo payment
- **Pending**: Chờ thanh toán (hiển thị QR)
- **Processing**: Đang xử lý (sau khi quét)
- **Completed**: Thành công
- **Expired**: Hết hạn
- **Failed**: Thất bại

## 🚀 Deployment Notes

### 1. Production Configuration

```env
VIETQR_BANK_ID=970422
VIETQR_ACCOUNT_NO=<your-real-account>
VIETQR_ACCOUNT_NAME=<your-business-name>
```

### 2. Webhook URL

Cần đăng ký webhook URL với ngân hàng:
```
https://your-domain.com/api/webhooks/payment
```

### 3. CORS Configuration

Đảm bảo WebSocket CORS được cấu hình đúng trong production.

## 📊 Monitoring

### Metrics Cần Theo Dõi

1. Payment creation rate
2. Payment success rate
3. Average payment time
4. Webhook response time
5. WebSocket connection status

### Logs

- Payment created: `Payment created: {code} for order: {orderId}`
- Payment completed: `Payment completed successfully: {code}`
- Webhook received: `Received webhook for payment: {code}`
- Errors: Amount mismatch, payment not found, etc.

## 🔄 Future Enhancements

1. **Multiple Banks**: Hỗ trợ nhiều ngân hàng
2. **Payment Methods**: Thêm ví điện tử, thẻ
3. **Refund**: Tính năng hoàn tiền
4. **Installment**: Trả góp
5. **Analytics**: Dashboard thống kê
6. **Notifications**: Email/SMS khi thanh toán thành công

## 📞 Support

Nếu có vấn đề, kiểm tra:
1. Database connection
2. VietQR API availability
3. WebSocket connection
4. JWT token validity
5. Order status và ownership

---

**Version**: 1.0.0  
**Last Updated**: 2026-05-11  
**Author**: Cutie Cuts Development Team
