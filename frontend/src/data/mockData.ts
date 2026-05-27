import barber1 from '@/assets/barber-1.jpg';
import barber2 from '@/assets/barber-2.jpg';
import barber3 from '@/assets/barber-3.jpg';

export interface Service {
  id: string;
  slug?: string;
  nameKey: string;
  descKey: string;
  name?: string;
  description?: string;
  price: number;
  displayPrice?: string;
  priceLabel?: string;
  duration: number;
  category: 'haircut' | 'styling' | 'coloring' | 'grooming' | string;
  categoryLabel?: string;
  actionLabel?: string;
}

export interface Barber {
  id: string;
  name: string;
  role: string;
  image: string;
  experience: number;
  specialties: string[];
  rating: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  category: string;
  description: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  commentKey: string;
  comment?: string;
  date: string;
  avatar: string;
}

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  category: 'fade' | 'classic' | 'modern' | 'color';
}

export const services: Service[] = [
  { id: '1', slug: 'cat-toc-hoc-sinh', nameKey: '', descKey: '', name: 'Cắt Tóc Học Sinh', price: 60000, displayPrice: '60.000đ', priceLabel: '60.000đ', description: 'Dịch vụ cắt tóc chuyên nghiệp, tạo kiểu thời trang dành riêng cho các bạn học sinh.', duration: 30, category: 'haircut', categoryLabel: 'Cắt tóc', actionLabel: 'Đặt' },
  { id: '2', slug: 'cat-toc-sinh-vien-nguoi-lon', nameKey: '', descKey: '', name: 'Cắt Tóc Sinh Viên & Người Lớn', price: 70000, displayPrice: '70.000đ', priceLabel: '70.000đ', description: 'Tư vấn và cắt tạo kiểu tóc phù hợp nhất với khuôn mặt dành cho sinh viên và người đi làm.', duration: 30, category: 'haircut', categoryLabel: 'Cắt tóc', actionLabel: 'Đặt' },
  { id: '3', slug: 'cat-keo-chuyen-sau', nameKey: '', descKey: '', name: 'Cắt Kéo Chuyên Sâu', price: 85000, displayPrice: '80.000đ - 90.000đ', priceLabel: '80.000đ - 90.000đ', description: 'Kỹ thuật cắt phom tóc hoàn toàn bằng kéo, giúp tóc giữ nếp tự nhiên, mềm mại và bền dáng.', duration: 40, category: 'haircut', categoryLabel: 'Cắt tóc', actionLabel: 'Đặt' },
  { id: '4', slug: 'goi-sau-khi-cat', nameKey: '', descKey: '', name: 'Gội Sau Khi Cắt', price: 10000, displayPrice: '10.000đ', priceLabel: '10.000đ', description: 'Xả gội và sấy sạch tóc con bám dính sau khi cắt, giúp bạn thoải mái tiếp tục công việc.', duration: 5, category: 'haircut', categoryLabel: 'Cắt tóc', actionLabel: 'Đặt' },
  { id: '5', slug: 'combo-wow-handsome', nameKey: '', descKey: '', name: 'Combo Wow Handsome', price: 119000, displayPrice: '119.000đ', priceLabel: '119.000đ', description: 'Gói combo chuẩn nam thần bao gồm các bước: Cắt tóc tạo kiểu, gội đầu sạch sâu và massage thư giãn đầu mặt cơ bản.', duration: 45, category: 'haircut', categoryLabel: 'Cắt tóc', actionLabel: 'Đặt' },
  { id: '6', slug: 'uon-thuong', nameKey: '', descKey: '', name: 'Uốn Thường', price: 300000, displayPrice: '300.000đ', priceLabel: '300.000đ', description: 'Uốn lạnh tạo độ phồng phom tóc, định hình nếp tóc cơ bản giúp dễ dàng vuốt sấy tại nhà.', duration: 60, category: 'styling', categoryLabel: 'Tạo kiểu', actionLabel: 'Đặt' },
  { id: '7', slug: 'uon-ruffled', nameKey: '', descKey: '', name: 'Uốn Ruffled', price: 400000, displayPrice: '400.000đ', priceLabel: '400.000đ', description: 'Kỹ thuật uốn kết cấu rối châu Âu cá tính, phong cách hiện đại độc đáo và cực kỳ năng động.', duration: 90, category: 'styling', categoryLabel: 'Tạo kiểu', actionLabel: 'Đặt' },
  { id: '8', slug: 'ep-side-toc', nameKey: '', descKey: '', name: 'Ép Side Tóc', price: 200000, displayPrice: '150.000đ - 300.000đ', priceLabel: '150.000đ - 300.000đ', description: 'Ép định hình phần tóc mai và sau gáy ôm sát da đầu, xử lý triệt để tình trạng tóc bung chĩa.', duration: 45, category: 'styling', categoryLabel: 'Tạo kiểu', actionLabel: 'Đặt' },
  { id: '9', slug: 'nhuom-thuong', nameKey: '', descKey: '', name: 'Nhuộm Thường', price: 300000, displayPrice: '300.000đ', priceLabel: '300.000đ', description: 'Nhuộm phủ đều các tông màu thời trang cơ bản, sử dụng thuốc nhuộm chất lượng cao bền màu và giữ bóng.', duration: 60, category: 'coloring', categoryLabel: 'Nhuộm', actionLabel: 'Đặt' },
  { id: '10', slug: 'tay-toc-1-lan', nameKey: '', descKey: '', name: 'Tẩy Tóc (1 lần)', price: 200000, displayPrice: '200.000đ', priceLabel: '200.000đ', description: 'Nâng nền tóc bằng thuốc tẩy cao cấp giảm xơ rối, chuẩn bị cho các tông màu nhuộm sáng, màu khói hoặc pastel.', duration: 45, category: 'coloring', categoryLabel: 'Nhuộm', actionLabel: 'Đặt' },
  { id: '11', slug: 'goi-dau-sieu-thu-gian', nameKey: '', descKey: '', name: 'Gội Đầu Siêu Thư Giãn', price: 60000, displayPrice: '60.000đ', priceLabel: '60.000đ', description: 'Gói gội xả kết hợp massage mặt cơ bản, bấm huyệt đầu giải tỏa căng thẳng và sấy tạo kiểu tóc.', duration: 30, category: 'care', categoryLabel: 'Chăm sóc', actionLabel: 'Đặt' },
  { id: '12', slug: 'goi-dau-duong-sinh', nameKey: '', descKey: '', name: 'Gội Đầu Dưỡng Sinh', price: 150000, displayPrice: '150.000đ', priceLabel: '150.000đ', description: 'Liệu trình chuyên sâu 60 phút: Gội đầu hai nước sạch sâu, rửa mặt, massage mặt chuyên sâu, massage cổ vai gáy giảm đau mỏi, bấm huyệt trị liệu và sấy tóc.', duration: 60, category: 'care', categoryLabel: 'Chăm sóc', actionLabel: 'Đặt' },
  { id: '13', slug: 'tay-te-bao-chet-da-mat', nameKey: '', descKey: '', name: 'Tẩy Tế Bào Chết Da Mặt', price: 30000, displayPrice: '30.000đ', priceLabel: '30.000đ', description: 'Làm sạch sâu bụi bẩn, loại bỏ bã nhờn tích tụ trên da mặt kết hợp massage thư giãn nhẹ nhàng.', duration: 15, category: 'care', categoryLabel: 'Chăm sóc', actionLabel: 'Đặt' },
  { id: '14', slug: 'dap-mat-na-duong-da', nameKey: '', descKey: '', name: 'Đắp Mặt Nạ Dưỡng Da', price: 30000, displayPrice: '30.000đ', priceLabel: '30.000đ', description: 'Cung cấp độ ẩm dồi dào và dưỡng chất làm dịu, sáng da, đi kèm các bước massage thư giãn các cơ cơ mặt.', duration: 15, category: 'care', categoryLabel: 'Chăm sóc', actionLabel: 'Đặt' },
  { id: '15', slug: 'tay-te-bao-chet-da-dau', nameKey: '', descKey: '', name: 'Tẩy Tế Bào Chết Da Đầu', price: 30000, displayPrice: '30.000đ', priceLabel: '30.000đ', description: 'Làm sạch vảy gàu dư thừa, thông thoáng nang tóc, ngăn ngừa nấm ngứa da đầu kèm massage kích thích mọc tóc.', duration: 15, category: 'care', categoryLabel: 'Chăm sóc', actionLabel: 'Đặt' },
  { id: '16', slug: 'combo-dep-tryyy-lai-con-dai', nameKey: '', descKey: '', name: 'Combo Đẹp Tryyy (Lại còn dài)', price: 199000, displayPrice: '199.000đ', priceLabel: '199.000đ', description: 'Gói chăm sóc phục hồi toàn diện cao cấp: Cắt tóc, rửa mặt sạch sâu, tẩy da chết mặt, massage mặt chuyên sâu, massage giảm mỏi cổ vai gáy và ấn huyệt đầu.', duration: 75, category: 'care', categoryLabel: 'Chăm sóc', actionLabel: 'Đặt' },
];

export const barbers: Barber[] = [
  { id: '1', name: 'Marcus Cole', role: 'Master Barber', image: barber1, experience: 12, specialties: ['Fades', 'Classic Cuts'], rating: 4.9 },
  { id: '2', name: 'Jake Rivera', role: 'Senior Barber', image: barber2, experience: 8, specialties: ['Beard Design', 'Hot Shaves'], rating: 4.8 },
  { id: '3', name: 'Sofia Chen', role: 'Color Specialist', image: barber3, experience: 10, specialties: ['Coloring', 'Modern Styles'], rating: 4.9 },
];

export const products: Product[] = [
  { id: '1', name: 'Premium Hair Wax', price: 24.99, image: 'https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=400', rating: 4.7, category: 'Styling', description: 'Strong hold matte finish wax' },
  { id: '2', name: 'Styling Gel', price: 18.99, image: 'https://images.unsplash.com/photo-1626784215021-2e39ccf971cd?w=400', rating: 4.5, category: 'Styling', description: 'Medium hold wet look gel' },
  { id: '3', name: 'Hair Spray', price: 16.99, image: 'https://images.unsplash.com/photo-1597854710218-d2965630e4aa?w=400', rating: 4.3, category: 'Finishing', description: 'Long-lasting flexible hold spray' },
  { id: '4', name: 'Beard Oil', price: 22.99, image: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=400', rating: 4.8, category: 'Beard Care', description: 'Nourishing beard oil with argan' },
  { id: '5', name: 'Pomade', price: 21.99, image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400', rating: 4.6, category: 'Styling', description: 'Classic pomade for slick styles' },
  { id: '6', name: 'Shampoo', price: 14.99, image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400', rating: 4.4, category: 'Hair Care', description: 'Sulfate-free daily shampoo' },
];

export const reviews: Review[] = [
  { id: '1', name: 'David M.', rating: 5, commentKey: 'r1', date: '2024-03-15', avatar: 'DM' },
  { id: '2', name: 'Chris P.', rating: 5, commentKey: 'r2', date: '2024-03-10', avatar: 'CP' },
  { id: '3', name: 'Alex T.', rating: 4, commentKey: 'r3', date: '2024-02-28', avatar: 'AT' },
  { id: '4', name: 'Ryan K.', rating: 5, commentKey: 'r4', date: '2024-02-20', avatar: 'RK' },
  { id: '5', name: 'James L.', rating: 5, commentKey: 'r5', date: '2024-02-15', avatar: 'JL' },
];

export const galleryImages: GalleryImage[] = [
  { id: '1', src: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600', alt: 'Classic fade haircut', category: 'fade' },
  { id: '2', src: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600', alt: 'Modern textured crop', category: 'modern' },
  { id: '3', src: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600', alt: 'Classic pompadour', category: 'classic' },
  { id: '4', src: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600', alt: 'Platinum blonde color', category: 'color' },
  { id: '5', src: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600', alt: 'Low skin fade', category: 'fade' },
  { id: '6', src: 'https://images.unsplash.com/photo-1567894340315-735d7c361db0?w=600', alt: 'Slicked back modern', category: 'modern' },
  { id: '7', src: 'https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?w=600', alt: 'Gentleman cut', category: 'classic' },
  { id: '8', src: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600', alt: 'Highlight coloring', category: 'color' },
];

export const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
];
