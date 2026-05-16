# Troubleshooting: QR Code trả về NULL

## 🔍 Vấn đề

Khi gọi API `POST /api/payments`, response trả về:
```json
{
  "qrCodeUrl": null,
  "qrDataUrl": null
}
```

## 🎯 Nguyên nhân có thể

### 1. **VietQR API Call thất bại**
VietQR API có thể:
- Không kết nối được (network issue)
- Trả về lỗi (invalid credentials, rate limit)
- Response format không đúng

### 2. **Thiếu hoặc sai thông tin cấu hình**
Kiểm tra file `.env`:
```bash
VIETQR_BANK_ID=970407        # Mã ngân hàng (BIN)
VIETQR_ACCOUNT_NO=0964279718 # Số tài khoản
VIETQR_ACCOUNT_NAME=CUTIE CUTS SALON  # Tên tài khoản
```

### 3. **VietQR API đang bảo trì hoặc thay đổi format**

---

## 🛠️ Cách Debug

### Bước 1: Kiểm tra logs

Sau khi đã update `VietQRService.java`, restart backend và xem logs:

```bash
cd backend/cutie-cuts-app
mvn spring-boot:run
```

Khi tạo payment, logs sẽ hiển thị:
```
INFO: Calling VietQR API: https://api.vietqr.io/v2/generate with payment code: CUTIE20260511..., amount: 150000
INFO: Request body: accountNo=0964279718, bankId=970407, accountName=CUTIE CUTS SALON
INFO: VietQR API response status: 200
INFO: VietQR API response code: 00, desc: Successful
INFO: QR Code generated successfully. QR URL length: 5234
```

**Nếu thấy lỗi:**
```
ERROR: Error calling VietQR API: Connection refused
WARN: Continuing payment creation without QR code
```

→ VietQR API không kết nối được

### Bước 2: Test VietQR API trực tiếp

Dùng Postman hoặc curl để test:

```bash
curl -X POST https://api.vietqr.io/v2/generate \
  -H "Content-Type: application/json" \
  -d '{
    "accountNo": "0964279718",
    "accountName": "CUTIE CUTS SALON",
    "acqId": "970407",
    "amount": 150000,
    "addInfo": "TEST123",
    "format": "text",
    "template": "compact2"
  }'
```

**Response mong đợi:**
```json
{
  "code": "00",
  "desc": "Successful",
  "data": {
    "qrCode": "https://img.vietqr.io/image/970407-0964279718-compact2.jpg?amount=150000&addInfo=TEST123",
    "qrDataURL": "data:image/png;base64,iVBORw0KGgo..."
  }
}
```

**Nếu lỗi:**
```json
{
  "code": "99",
  "desc": "Invalid bank account"
}
```

→ Thông tin tài khoản không đúng

### Bước 3: Kiểm tra thông tin ngân hàng

Đảm bảo:
1. **Số tài khoản** (`0964279718`) là tài khoản thật và đang hoạt động
2. **Mã ngân hàng** (`970407` = Techcombank) khớp với ngân hàng của tài khoản
3. **Tên tài khoản** không có ký tự đặc biệt

**Danh sách mã ngân hàng phổ biến:**
- `970407` - Techcombank
- `970422` - MB Bank
- `970415` - Vietinbank
- `970436` - Vietcombank
- `970418` - BIDV
- `970405` - Agribank

---

## ✅ Giải pháp

### Giải pháp 1: Sử dụng tài khoản test của VietQR

Nếu chưa có tài khoản thật, dùng thông tin test:

```env
VIETQR_BANK_ID=970422
VIETQR_ACCOUNT_NO=0123456789
VIETQR_ACCOUNT_NAME=NGUYEN VAN A
```

### Giải pháp 2: Fallback - Generate QR manually

Nếu VietQR API không hoạt động, có thể generate QR code URL trực tiếp:

**Update `VietQRService.java`:**

```java
public VietQRResponse generateQRCode(String paymentCode, Double amount) {
    try {
        // Try calling VietQR API first
        // ... existing code ...
        
    } catch (Exception e) {
        logger.error("VietQR API failed, using fallback URL generation", e);
        
        // Fallback: Generate QR URL manually
        VietQRResponse fallbackResponse = new VietQRResponse();
        fallbackResponse.setCode("00");
        fallbackResponse.setDesc("Generated using fallback");
        
        VietQRResponse.VietQRData data = new VietQRResponse.VietQRData();
        
        // Generate QR URL using VietQR image service
        String qrUrl = String.format(
            "https://img.vietqr.io/image/%s-%s-%s.jpg?amount=%.0f&addInfo=%s",
            bankId, accountNo, template, amount, paymentCode
        );
        
        data.setQrCode(qrUrl);
        // qrDataURL will be null in fallback mode
        
        fallbackResponse.setData(data);
        return fallbackResponse;
    }
}
```

### Giải pháp 3: Kiểm tra network/firewall

VietQR API có thể bị chặn bởi:
- Corporate firewall
- Antivirus software
- VPN settings

Thử:
```bash
ping api.vietqr.io
curl https://api.vietqr.io/v2/generate
```

---

## 📊 Kiểm tra sau khi fix

1. **Restart backend:**
```bash
mvn spring-boot:run
```

2. **Tạo payment mới qua Swagger:**
```
POST /api/payments
{
  "orderId": 1
}
```

3. **Kiểm tra response:**
```json
{
  "qrCodeUrl": "https://img.vietqr.io/image/...",  // ✅ Không null
  "qrDataUrl": "data:image/png;base64,..."         // ✅ Không null
}
```

4. **Copy `qrCodeUrl` vào browser** để xem QR code

---

## 🔄 Nếu vẫn NULL

### Option A: Sử dụng QR code URL thay vì data URL

Frontend chỉ cần `qrCodeUrl` để hiển thị:

```tsx
<img src={payment.qrCodeUrl} alt="QR Code" />
```

### Option B: Generate QR code ở frontend

Cài đặt thư viện:
```bash
npm install qrcode.react
```

Sử dụng:
```tsx
import QRCode from 'qrcode.react';

<QRCode 
  value={`${bankAccount}|${amount}|${paymentCode}`}
  size={256}
/>
```

### Option C: Tạm thời disable QR code

Payment vẫn hoạt động, chỉ hiển thị thông tin chuyển khoản:
- Số tài khoản: `0964279718`
- Ngân hàng: `Techcombank`
- Số tiền: `150,000 VND`
- Nội dung: `CUTIE20260511...`

---

## 📝 Notes

- VietQR API là **FREE** và không cần API key
- API có rate limit: ~100 requests/minute
- QR code có thời hạn: Payment expire sau 15 phút
- Trong production, nên có fallback mechanism

---

## 🆘 Cần hỗ trợ thêm?

1. Gửi logs đầy đủ từ console
2. Test VietQR API trực tiếp và gửi response
3. Xác nhận thông tin tài khoản ngân hàng
