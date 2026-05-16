# Hướng dẫn test quét QR thanh toán VietQR

## 🎯 2 Cách test QR code

### ✅ Cách 1: Test với App ngân hàng thật (Khuyến nghị)

**Yêu cầu:**
- Có tài khoản ngân hàng hỗ trợ VietQR (MB Bank, VCB, Techcombank, ACB, v.v.)
- Cài app ngân hàng trên điện thoại
- Có tiền trong tài khoản 😄

**Bước 1: Tạo payment và lấy QR code**

1. Mở Swagger: http://localhost:8081/swagger-ui.html
2. Login để lấy JWT token
3. Tạo order với sản phẩm
4. Tạo payment từ order → Nhận được `qrDataUrl`

**Bước 2: Hiển thị QR code**

Có 3 cách hiển thị:

#### Option A: Dùng frontend (Tốt nhất)
```bash
# Mở frontend
start http://localhost:5173

# Login → Tạo order → Checkout → QR code sẽ hiển thị
```

#### Option B: Mở URL trực tiếp
Copy `qrDataUrl` từ response và paste vào browser:
```
https://img.vietqr.io/image/970422-0123456789-compact.png?amount=150000&addInfo=PAY_ABC123&accountName=CUTIE%20CUTS%20SALON
```

#### Option C: Dùng tool online
1. Copy `qrDataUrl` 
2. Mở https://www.qr-code-generator.com/
3. Paste URL → Generate QR

**Bước 3: Quét QR bằng app ngân hàng**

1. Mở app ngân hàng (MB Bank, VCB, v.v.)
2. Chọn "Chuyển khoản" → "Quét QR"
3. Quét QR code vừa tạo
4. App sẽ tự động điền:
   - **Số tài khoản:** 0123456789 (từ .env)
   - **Ngân hàng:** MB Bank (970422)
   - **Số tiền:** 150,000 VND
   - **Nội dung:** PAY_ABC123
5. Xác nhận chuyển khoản

**Bước 4: Kiểm tra kết quả**

```bash
# Xem payment status
curl.exe http://localhost:8081/api/payments/{paymentCode}

# Hoặc trong Swagger: GET /api/payments/{paymentCode}
```

Status sẽ chuyển từ `PENDING` → `COMPLETED` (nếu có webhook)

---

### ✅ Cách 2: Test không cần chuyển tiền thật (Development)

**Dùng VietQR Sandbox/Test Environment**

⚠️ **Lưu ý:** VietQR API hiện tại không có sandbox public. Để test mà không chuyển tiền thật:

#### Option A: Mock webhook callback
```bash
# Giả lập webhook từ ngân hàng
curl.exe -X POST http://localhost:8081/api/webhooks/payment ^
  -H "Content-Type: application/json" ^
  -d "{\"paymentCode\":\"PAY_ABC123\",\"amount\":150000,\"status\":\"SUCCESS\",\"transactionCode\":\"FT123456\",\"bankCode\":\"970422\"}"
```

#### Option B: Tạo QR test với số tiền nhỏ
```bash
# Sửa trong .env
VIETQR_ACCOUNT_NO=0123456789  # Tài khoản test của bạn
VIETQR_BANK_ID=970422         # Mã ngân hàng của bạn

# Tạo payment với số tiền nhỏ (1,000 VND)
# Sau đó quét và chuyển thật để test
```

#### Option C: Dùng QR code reader để verify
```bash
# Cài tool đọc QR
npm install -g qrcode-reader-cli

# Đọc nội dung QR
qrcode-reader path/to/qr-image.png
```

Kết quả sẽ hiển thị URL:
```
https://img.vietqr.io/image/970422-0123456789-compact.png?amount=150000&addInfo=PAY_ABC123&accountName=CUTIE%20CUTS%20SALON
```

Verify:
- ✅ `amount=150000` (đúng số tiền)
- ✅ `addInfo=PAY_ABC123` (đúng payment code)
- ✅ `accountName=CUTIE%20CUTS%20SALON` (đúng tên shop)

---

## 📱 Test flow hoàn chỉnh

### Bước 1: Chuẩn bị môi trường

```bash
# 1. Kiểm tra backend đang chạy
curl.exe http://localhost:8081/actuator/health

# 2. Kiểm tra frontend đang chạy
start http://localhost:5173

# 3. Kiểm tra database
docker exec cutie-cuts-postgres psql -U postgres -d haircut_db -c "SELECT COUNT(*) FROM products;"
```

### Bước 2: Tạo order và payment

**Via Frontend (Khuyến nghị):**
1. Mở http://localhost:5173
2. Login với `user@cutiecuts.com` / `123456`
3. Thêm sản phẩm vào cart
4. Checkout → Chọn "QR Payment"
5. QR code hiển thị

**Via Swagger:**
1. Mở http://localhost:8081/swagger-ui.html
2. POST `/api/auth/login` → Lấy token
3. Authorize với token
4. POST `/api/orders` → Tạo order
5. POST `/api/payments` → Tạo payment
6. Copy `qrDataUrl` từ response

### Bước 3: Quét QR

**Trên điện thoại:**
1. Mở app ngân hàng
2. Quét QR code từ màn hình máy tính
3. Xác nhận thông tin
4. Chuyển khoản

**Hoặc dùng camera điện thoại:**
- Mở camera → Quét QR → Mở link → App ngân hàng tự động mở

### Bước 4: Verify payment

```bash
# Xem logs backend
docker logs cutie-cuts-backend -f

# Tìm dòng:
# "Payment webhook received: PAY_ABC123"
# "Payment status updated: COMPLETED"
```

**Trong frontend:**
- Payment status tự động update qua WebSocket
- Hiển thị "Payment Successful" ✅

---

## 🔧 Troubleshooting

### Vấn đề 1: QR code không hiển thị
**Nguyên nhân:** `qrDataUrl` null

**Giải pháp:**
```bash
# Kiểm tra logs
docker logs cutie-cuts-backend -f

# Tìm lỗi VietQR API
# Thường do amount không hợp lệ hoặc thiếu config
```

### Vấn đề 2: Quét QR nhưng không có thông tin
**Nguyên nhân:** URL QR không đúng format

**Kiểm tra:**
```bash
# URL phải có dạng:
https://img.vietqr.io/image/{bankId}-{accountNo}-{template}.png?amount={amount}&addInfo={info}
```

### Vấn đề 3: Chuyển khoản rồi nhưng status không đổi
**Nguyên nhân:** Webhook chưa được setup

**Giải pháp:**
- VietQR API miễn phí không hỗ trợ webhook tự động
- Cần đăng ký gói trả phí hoặc dùng bank API riêng
- Hoặc manual update status:

```bash
curl.exe -X POST http://localhost:8081/api/webhooks/payment ^
  -H "Content-Type: application/json" ^
  -d "{\"paymentCode\":\"PAY_ABC123\",\"status\":\"SUCCESS\"}"
```

### Vấn đề 4: App ngân hàng báo "QR không hợp lệ"
**Nguyên nhân:** 
- Số tài khoản trong .env không đúng
- Bank ID không đúng

**Kiểm tra .env:**
```bash
VIETQR_ACCOUNT_NO=0123456789  # ← Phải là số tài khoản thật
VIETQR_BANK_ID=970422         # ← MB Bank
```

**Danh sách Bank ID:**
- MB Bank: 970422
- VCB: 970436
- Techcombank: 970407
- ACB: 970416
- VietinBank: 970415

---

## 📊 Test checklist

- [ ] Backend đang chạy (port 8081)
- [ ] Frontend đang chạy (port 5173)
- [ ] Database có sản phẩm với giá VND
- [ ] .env có config VietQR đúng
- [ ] Tạo order thành công
- [ ] Tạo payment thành công
- [ ] QR code hiển thị
- [ ] QR code có thể quét được
- [ ] App ngân hàng nhận đúng thông tin
- [ ] (Optional) Webhook update status

---

## 🎯 Demo nhanh (1 phút)

```bash
# 1. Tạo payment qua API
curl.exe -X POST http://localhost:8081/api/payments ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"orderId\":1,\"amount\":150000}"

# 2. Copy qrDataUrl từ response

# 3. Mở URL trong browser

# 4. Quét bằng điện thoại

# 5. Xác nhận trong app ngân hàng

# Done! ✅
```

---

## 💡 Tips

1. **Test với số tiền nhỏ trước:** 1,000 - 10,000 VND
2. **Dùng tài khoản test riêng:** Không dùng tài khoản chính
3. **Kiểm tra nội dung chuyển khoản:** Phải có `PAY_XXX` để tracking
4. **Lưu screenshot:** Để debug nếu có vấn đề
5. **Test trên nhiều ngân hàng:** Mỗi bank có UI khác nhau

---

## 🚀 Production checklist

Trước khi deploy production:

- [ ] Đổi `VIETQR_ACCOUNT_NO` thành tài khoản thật của shop
- [ ] Đổi `VIETQR_BANK_ID` thành ngân hàng của shop
- [ ] Đổi `VIETQR_ACCOUNT_NAME` thành tên shop
- [ ] Setup webhook endpoint public (dùng ngrok hoặc deploy)
- [ ] Test với nhiều mức giá khác nhau
- [ ] Test timeout (QR hết hạn sau 15 phút)
- [ ] Test concurrent payments
- [ ] Setup monitoring và alerts
- [ ] Backup database trước khi go-live

---

## 📞 Support

Nếu gặp vấn đề:
1. Xem logs: `docker logs cutie-cuts-backend -f`
2. Xem file: `TROUBLESHOOTING_QR_NULL.md`
3. Xem API docs: http://localhost:8081/swagger-ui.html
4. Test API: `PAYMENT_API_TESTING_GUIDE.md`
