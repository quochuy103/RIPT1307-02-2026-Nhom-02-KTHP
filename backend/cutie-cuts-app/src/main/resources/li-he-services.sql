alter table if exists services
    add column if not exists display_price varchar(50);

insert into services (id, name, price, display_price, description, duration, category)
values
    (1, 'Cắt Tóc Học Sinh', 60000, '60.000đ', 'Dịch vụ cắt tóc chuyên nghiệp, tạo kiểu thời trang dành riêng cho các bạn học sinh.', 30, 'haircut'),
    (2, 'Cắt Tóc Sinh Viên & Người Lớn', 70000, '70.000đ', 'Tư vấn và cắt tạo kiểu tóc phù hợp nhất với khuôn mặt dành cho sinh viên và người đi làm.', 30, 'haircut'),
    (3, 'Cắt Kéo Chuyên Sâu', 85000, '80.000đ - 90.000đ', 'Kỹ thuật cắt phom tóc hoàn toàn bằng kéo, giúp tóc giữ nếp tự nhiên, mềm mại và bền dáng.', 40, 'haircut'),
    (4, 'Gội Sau Khi Cắt', 10000, '10.000đ', 'Xả gội và sấy sạch tóc con bám dính sau khi cắt, giúp bạn thoải mái tiếp tục công việc.', 5, 'haircut'),
    (5, 'Combo Wow Handsome', 119000, '119.000đ', 'Gói combo chuẩn nam thần bao gồm các bước: Cắt tóc tạo kiểu, gội đầu sạch sâu và massage thư giãn đầu mặt cơ bản.', 45, 'haircut'),
    (6, 'Uốn Thường', 300000, '300.000đ', 'Uốn lạnh tạo độ phồng phom tóc, định hình nếp tóc cơ bản giúp dễ dàng vuốt sấy tại nhà.', 60, 'styling'),
    (7, 'Uốn Ruffled', 400000, '400.000đ', 'Kỹ thuật uốn kết cấu rối châu Âu cá tính, phong cách hiện đại độc đáo và cực kỳ năng động.', 90, 'styling'),
    (8, 'Ép Side Tóc', 200000, '150.000đ - 300.000đ', 'Ép định hình phần tóc mai và sau gáy ôm sát da đầu, xử lý triệt để tình trạng tóc bung chĩa.', 45, 'styling'),
    (9, 'Nhuộm Thường', 300000, '300.000đ', 'Nhuộm phủ đều các tông màu thời trang cơ bản, sử dụng thuốc nhuộm chất lượng cao bền màu và giữ bóng.', 60, 'coloring'),
    (10, 'Tẩy Tóc (1 lần)', 200000, '200.000đ', 'Nâng nền tóc bằng thuốc tẩy cao cấp giảm xơ rối, chuẩn bị cho các tông màu nhuộm sáng, màu khói hoặc pastel.', 45, 'coloring'),
    (11, 'Gội Đầu Siêu Thư Giãn', 60000, '60.000đ', 'Gói gội xả kết hợp massage mặt cơ bản, bấm huyệt đầu giải tỏa căng thẳng và sấy tạo kiểu tóc.', 30, 'care'),
    (12, 'Gội Đầu Dưỡng Sinh', 150000, '150.000đ', 'Liệu trình chuyên sâu 60 phút: Gội đầu hai nước sạch sâu, rửa mặt, massage mặt chuyên sâu, massage cổ vai gáy giảm đau mỏi, bấm huyệt trị liệu và sấy tóc.', 60, 'care'),
    (13, 'Tẩy Tế Bào Chết Da Mặt', 30000, '30.000đ', 'Làm sạch sâu bụi bẩn, loại bỏ bã nhờn tích tụ trên da mặt kết hợp massage thư giãn nhẹ nhàng.', 15, 'care'),
    (14, 'Đắp Mặt Nạ Dưỡng Da', 30000, '30.000đ', 'Cung cấp độ ẩm dồi dào và dưỡng chất làm dịu, sáng da, đi kèm các bước massage thư giãn các cơ cơ mặt.', 15, 'care'),
    (15, 'Tẩy Tế Bào Chết Da Đầu', 30000, '30.000đ', 'Làm sạch vảy gàu dư thừa, thông thoáng nang tóc, ngăn ngừa nấm ngứa da đầu kèm massage kích thích mọc tóc.', 15, 'care'),
    (16, 'Combo Đẹp Tryyy (Lại còn dài)', 199000, '199.000đ', 'Gói chăm sóc phục hồi toàn diện cao cấp: Cắt tóc, rửa mặt sạch sâu, tẩy da chết mặt, massage mặt chuyên sâu, massage giảm mỏi cổ vai gáy và ấn huyệt đầu.', 75, 'care')
on conflict (id) do update set
    name = excluded.name,
    price = excluded.price,
    display_price = excluded.display_price,
    description = excluded.description,
    duration = excluded.duration,
    category = excluded.category;

select setval(pg_get_serial_sequence('services', 'id'), greatest((select max(id) from services), 1), true);
