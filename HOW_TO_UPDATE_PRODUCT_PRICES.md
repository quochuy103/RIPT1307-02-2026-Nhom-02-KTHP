# Hướng dẫn cập nhật giá sản phẩm cho VietQR Payment

## 📍 Nơi lưu trữ dữ liệu sản phẩm

Dữ liệu sản phẩm được lưu ở **2 nơi**:

### 1. **File Java - DataInitializer.java** (Seed data ban đầu)
📁 `backend/cutie-cuts-app/src/main/java/com/cutie_cuts_app/example/cutie_cuts_app/config/DataInitializer.java`

**Dòng 71-90:** Định nghĩa sản phẩm mẫu
```java
if (productRepository.count() == 0) {
    Product p1 = new Product();
    p1.setName("Premium Hair Wax");
    p1.setPrice(24.99);  // ❌ Giá USD - cần đổi sang VND
    
    Product p2 = new Product();
    p2.setName("Beard Oil");
    p2.setPrice(22.99);  // ❌ Giá USD - cần đổi sang VND
}
```

### 2. **Database PostgreSQL** (Dữ liệu thực tế đang chạy)
- Database: `haircut_db`
- Table: `products`
- Container: `cutie-cuts-postgres`

**Dữ liệu hiện tại:**
```
id |       name       | price |  category
----+------------------+-------+------------
  1 | Premium Hair Wax | 24.99 | Styling
  2 | Beard Oil        | 22.99 | Beard Care
```

---

## 🔧 Cách sửa giá sản phẩm

### ⚠️ Vấn đề hiện tại
VietQR API yêu cầu amount phải là **số nguyên VND** (không có phần thập phân).
- ❌ `24.99` → Lỗi: "Invalid amount - Trường chỉ nhập số, tối đa 13 kí tự"
- ✅ `150000` → OK

---

## 🎯 Giải pháp 1: Cập nhật trực tiếp trong Database (Nhanh nhất)

### Bước 1: Kết nối vào database
```bash
docker exec -it cutie-cuts-postgres psql -U postgres -d haircut_db
```

### Bước 2: Xem giá hiện tại
```sql
SELECT id, name, price FROM products;
```

### Bước 3: Cập nhật giá sang VND
```sql
-- Cập nhật Premium Hair Wax: 24.99 USD → 150,000 VND
UPDATE products SET price = 150000 WHERE id = 1;

-- Cập nhật Beard Oil: 22.99 USD → 120,000 VND
UPDATE products SET price = 120000 WHERE id = 2;
```

### Bước 4: Verify
```sql
SELECT id, name, price FROM products;
```

Kết quả mong đợi:
```
id |       name       |  price
----+------------------+---------
  1 | Premium Hair Wax | 150000
  2 | Beard Oil        | 120000
```

### Bước 5: Thoát
```sql
\q
```

### Bước 6: Test payment
Giờ tạo payment mới, QR code sẽ generate thành công! ✅

---

## 🎯 Giải pháp 2: Cập nhật DataInitializer.java (Lâu dài)

Nếu muốn giá VND được seed từ đầu khi reset database:

### Bước 1: Sửa file DataInitializer.java

**Dòng 74 và 83:**
```java
if (productRepository.count() == 0) {
    Product p1 = new Product();
    p1.setName("Premium Hair Wax");
    p1.setPrice(150000.0);  // ✅ Đổi sang VND
    p1.setImage("https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=400");
    p1.setCategory("Styling");
    p1.setDescription("Strong hold matte finish wax");
    p1.setRating(4.7);
    p1.setStock(50);

    Product p2 = new Product();
    p2.setName("Beard Oil");
    p2.setPrice(120000.0);  // ✅ Đổi sang VND
    p2.setImage("https://images.unsplash.com/photo-1621607512214-68297480165e?w=400");
    p2.setCategory("Beard Care");
    p2.setDescription("Nourishing beard oil with argan");
    p2.setRating(4.8);
    p2.setStock(40);

    productRepository.saveAll(List.of(p1, p2));
}
```

### Bước 2: Rebuild và restart
```bash
cd backend/cutie-cuts-app
mvn clean package
docker-compose restart
```

**Lưu ý:** Chỉ áp dụng khi tạo sản phẩm mới. Sản phẩm đã tồn tại trong DB không bị ảnh hưởng.

---

## 🎯 Giải pháp 3: Xóa và tạo lại database (Reset hoàn toàn)

### ⚠️ Cảnh báo: Sẽ mất toàn bộ dữ liệu!

```bash
# 1. Stop containers
docker-compose down

# 2. Xóa volume database
docker volume rm cutie-cuts-app_postgres_data

# 3. Sửa DataInitializer.java (như Giải pháp 2)

# 4. Start lại
docker-compose up -d
```

Database mới sẽ được tạo với giá VND từ đầu.

---

## 📊 Bảng quy đổi giá đề xuất

| Sản phẩm | Giá USD | Giá VND đề xuất |
|----------|---------|-----------------|
| Premium Hair Wax | $24.99 | 150,000 VND |
| Beard Oil | $22.99 | 120,000 VND |
| Hair Gel | $19.99 | 100,000 VND |
| Shampoo | $15.99 | 80,000 VND |
| Conditioner | $15.99 | 80,000 VND |

---

## ✅ Kiểm tra sau khi cập nhật

### 1. Query database
```bash
docker exec cutie-cuts-postgres psql -U postgres -d haircut_db -c "SELECT id, name, price FROM products;"
```

### 2. Test API
```bash
curl http://localhost:8081/api/products
```

Response:
```json
[
  {
    "id": 1,
    "name": "Premium Hair Wax",
    "price": 150000.0,  // ✅ VND
    "category": "Styling"
  }
]
```

### 3. Test Payment
Tạo order với sản phẩm → Tạo payment → QR code sẽ generate thành công!

---

## 🚀 Khuyến nghị

**Cho môi trường development hiện tại:**
→ Dùng **Giải pháp 1** (Update trực tiếp database) - Nhanh nhất, không cần rebuild

**Cho production sau này:**
→ Dùng **Giải pháp 2** (Sửa DataInitializer) - Đảm bảo consistency

---

## 📞 Troubleshooting

### Vấn đề: Sau khi update vẫn báo lỗi amount
**Nguyên nhân:** Cache hoặc chưa restart backend

**Giải pháp:**
```bash
docker-compose restart backend
```

### Vấn đề: Không kết nối được database
**Kiểm tra:**
```bash
docker ps | findstr postgres
docker logs cutie-cuts-postgres
```

### Vấn đề: QR code vẫn null sau khi fix giá
**Kiểm tra logs:**
```bash
docker logs cutie-cuts-backend -f
```

Tìm dòng:
```
INFO: Calling VietQR API: ... amount: 150000
INFO: VietQR API response code: 00, desc: Successful
```

Nếu thấy `code: 00` → Thành công! ✅
