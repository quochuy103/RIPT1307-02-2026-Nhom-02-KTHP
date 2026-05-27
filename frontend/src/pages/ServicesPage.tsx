import { useEffect, useState } from 'react';
import type { Service } from '@/data/mockData';
import ServiceCard from '@/components/ServiceCard';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

const categories = [
  { value: 'all', label: 'Tất cả' },
  { value: 'haircut', label: 'Cắt tóc' },
  { value: 'styling', label: 'Tạo kiểu' },
  { value: 'coloring', label: 'Nhuộm' },
  { value: 'care', label: 'Chăm sóc' },
] as const;

const serviceList: Service[] = [
  {
    id: '1',
    slug: 'cat-toc-hoc-sinh',
    nameKey: '',
    descKey: '',
    name: 'Cắt Tóc Học Sinh',
    price: 60000,
    displayPrice: '60.000đ',
    priceLabel: '60.000đ',
    description: 'Dịch vụ cắt tóc chuyên nghiệp, tạo kiểu thời trang dành riêng cho các bạn học sinh.',
    duration: 30,
    category: 'haircut',
    categoryLabel: 'Cắt tóc',
    actionLabel: 'Đặt',
  },
  {
    id: '2',
    slug: 'cat-toc-sinh-vien-nguoi-lon',
    nameKey: '',
    descKey: '',
    name: 'Cắt Tóc Sinh Viên & Người Lớn',
    price: 70000,
    displayPrice: '70.000đ',
    priceLabel: '70.000đ',
    description: 'Tư vấn và cắt tạo kiểu tóc phù hợp nhất với khuôn mặt dành cho sinh viên và người đi làm.',
    duration: 30,
    category: 'haircut',
    categoryLabel: 'Cắt tóc',
    actionLabel: 'Đặt',
  },
  {
    id: '3',
    slug: 'cat-keo-chuyen-sau',
    nameKey: '',
    descKey: '',
    name: 'Cắt Kéo Chuyên Sâu',
    price: 85000,
    displayPrice: '80.000đ - 90.000đ',
    priceLabel: '80.000đ - 90.000đ',
    description: 'Kỹ thuật cắt phom tóc hoàn toàn bằng kéo, giúp tóc giữ nếp tự nhiên, mềm mại và bền dáng.',
    duration: 40,
    category: 'haircut',
    categoryLabel: 'Cắt tóc',
    actionLabel: 'Đặt',
  },
  {
    id: '4',
    slug: 'goi-sau-khi-cat',
    nameKey: '',
    descKey: '',
    name: 'Gội Sau Khi Cắt',
    price: 10000,
    displayPrice: '10.000đ',
    priceLabel: '10.000đ',
    description: 'Xả gội và sấy sạch tóc con bám dính sau khi cắt, giúp bạn thoải mái tiếp tục công việc.',
    duration: 5,
    category: 'haircut',
    categoryLabel: 'Cắt tóc',
    actionLabel: 'Đặt',
  },
  {
    id: '5',
    slug: 'combo-wow-handsome',
    nameKey: '',
    descKey: '',
    name: 'Combo Wow Handsome',
    price: 119000,
    displayPrice: '119.000đ',
    priceLabel: '119.000đ',
    description: 'Gói combo chuẩn nam thần bao gồm các bước: Cắt tóc tạo kiểu, gội đầu sạch sâu và massage thư giãn đầu mặt cơ bản.',
    duration: 45,
    category: 'haircut',
    categoryLabel: 'Cắt tóc',
    actionLabel: 'Đặt',
  },
  {
    id: '6',
    slug: 'uon-thuong',
    nameKey: '',
    descKey: '',
    name: 'Uốn Thường',
    price: 300000,
    displayPrice: '300.000đ',
    priceLabel: '300.000đ',
    description: 'Uốn lạnh tạo độ phồng phom tóc, định hình nếp tóc cơ bản giúp dễ dàng vuốt sấy tại nhà.',
    duration: 60,
    category: 'styling',
    categoryLabel: 'Tạo kiểu',
    actionLabel: 'Đặt',
  },
  {
    id: '7',
    slug: 'uon-ruffled',
    nameKey: '',
    descKey: '',
    name: 'Uốn Ruffled',
    price: 400000,
    displayPrice: '400.000đ',
    priceLabel: '400.000đ',
    description: 'Kỹ thuật uốn kết cấu rối châu Âu cá tính, phong cách hiện đại độc đáo và cực kỳ năng động.',
    duration: 90,
    category: 'styling',
    categoryLabel: 'Tạo kiểu',
    actionLabel: 'Đặt',
  },
  {
    id: '8',
    slug: 'ep-side-toc',
    nameKey: '',
    descKey: '',
    name: 'Ép Side Tóc',
    price: 200000,
    displayPrice: '150.000đ - 300.000đ',
    priceLabel: '150.000đ - 300.000đ',
    description: 'Ép định hình phần tóc mai và sau gáy ôm sát da đầu, xử lý triệt để tình trạng tóc bung chĩa.',
    duration: 45,
    category: 'styling',
    categoryLabel: 'Tạo kiểu',
    actionLabel: 'Đặt',
  },
  {
    id: '9',
    slug: 'nhuom-thuong',
    nameKey: '',
    descKey: '',
    name: 'Nhuộm Thường',
    price: 300000,
    displayPrice: '300.000đ',
    priceLabel: '300.000đ',
    description: 'Nhuộm phủ đều các tông màu thời trang cơ bản, sử dụng thuốc nhuộm chất lượng cao bền màu và giữ bóng.',
    duration: 60,
    category: 'coloring',
    categoryLabel: 'Nhuộm',
    actionLabel: 'Đặt',
  },
  {
    id: '10',
    slug: 'tay-toc-1-lan',
    nameKey: '',
    descKey: '',
    name: 'Tẩy Tóc (1 lần)',
    price: 200000,
    displayPrice: '200.000đ',
    priceLabel: '200.000đ',
    description: 'Nâng nền tóc bằng thuốc tẩy cao cấp giảm xơ rối, chuẩn bị cho các tông màu nhuộm sáng, màu khói hoặc pastel.',
    duration: 45,
    category: 'coloring',
    categoryLabel: 'Nhuộm',
    actionLabel: 'Đặt',
  },
  {
    id: '11',
    slug: 'goi-dau-sieu-thu-gian',
    nameKey: '',
    descKey: '',
    name: 'Gội Đầu Siêu Thư Giãn',
    price: 60000,
    displayPrice: '60.000đ',
    priceLabel: '60.000đ',
    description: 'Gói gội xả kết hợp massage mặt cơ bản, bấm huyệt đầu giải tỏa căng thẳng và sấy tạo kiểu tóc.',
    duration: 30,
    category: 'care',
    categoryLabel: 'Chăm sóc',
    actionLabel: 'Đặt',
  },
  {
    id: '12',
    slug: 'goi-dau-duong-sinh',
    nameKey: '',
    descKey: '',
    name: 'Gội Đầu Dưỡng Sinh',
    price: 150000,
    displayPrice: '150.000đ',
    priceLabel: '150.000đ',
    description: 'Liệu trình chuyên sâu 60 phút: Gội đầu hai nước sạch sâu, rửa mặt, massage mặt chuyên sâu, massage cổ vai gáy giảm đau mỏi, bấm huyệt trị liệu và sấy tóc.',
    duration: 60,
    category: 'care',
    categoryLabel: 'Chăm sóc',
    actionLabel: 'Đặt',
  },
  {
    id: '13',
    slug: 'tay-te-bao-chet-da-mat',
    nameKey: '',
    descKey: '',
    name: 'Tẩy Tế Bào Chết Da Mặt',
    price: 30000,
    displayPrice: '30.000đ',
    priceLabel: '30.000đ',
    description: 'Làm sạch sâu bụi bẩn, loại bỏ bã nhờn tích tụ trên da mặt kết hợp massage thư giãn nhẹ nhàng.',
    duration: 15,
    category: 'care',
    categoryLabel: 'Chăm sóc',
    actionLabel: 'Đặt',
  },
  {
    id: '14',
    slug: 'dap-mat-na-duong-da',
    nameKey: '',
    descKey: '',
    name: 'Đắp Mặt Nạ Dưỡng Da',
    price: 30000,
    displayPrice: '30.000đ',
    priceLabel: '30.000đ',
    description: 'Cung cấp độ ẩm dồi dào và dưỡng chất làm dịu, sáng da, đi kèm các bước massage thư giãn các cơ cơ mặt.',
    duration: 15,
    category: 'care',
    categoryLabel: 'Chăm sóc',
    actionLabel: 'Đặt',
  },
  {
    id: '15',
    slug: 'tay-te-bao-chet-da-dau',
    nameKey: '',
    descKey: '',
    name: 'Tẩy Tế Bào Chết Da Đầu',
    price: 30000,
    displayPrice: '30.000đ',
    priceLabel: '30.000đ',
    description: 'Làm sạch vảy gàu dư thừa, thông thoáng nang tóc, ngăn ngừa nấm ngứa da đầu kèm massage kích thích mọc tóc.',
    duration: 15,
    category: 'care',
    categoryLabel: 'Chăm sóc',
    actionLabel: 'Đặt',
  },
  {
    id: '16',
    slug: 'combo-dep-tryyy-lai-con-dai',
    nameKey: '',
    descKey: '',
    name: 'Combo Đẹp Tryyy (Lại còn dài)',
    price: 199000,
    displayPrice: '199.000đ',
    priceLabel: '199.000đ',
    description: 'Gói chăm sóc phục hồi toàn diện cao cấp: Cắt tóc, rửa mặt sạch sâu, tẩy da chết mặt, massage mặt chuyên sâu, massage giảm mỏi cổ vai gáy và ấn huyệt đầu.',
    duration: 75,
    category: 'care',
    categoryLabel: 'Chăm sóc',
    actionLabel: 'Đặt',
  },
];

const ServicesPage = () => {
  const [category, setCategory] = useState<string>('all');
  const [services, setServices] = useState<Service[]>(serviceList);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const filtered = category === 'all' ? services : services.filter((service) => service.category === category);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const loadedServices = await api.services.getAll();
        setServices(loadedServices);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Không thể tải danh sách dịch vụ từ máy chủ.');
        setServices(serviceList);
      } finally {
        setIsLoading(false);
      }
    };

    void loadServices();
  }, []);

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mb-10 max-w-2xl text-center">
          <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
            <span className="block">Bảng Dịch Vụ</span>
            <span className="block text-gradient-gold">Lì He Men's Hair Designer</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Chọn dịch vụ phù hợp với nhu cầu cắt tóc, tạo kiểu, nhuộm hoặc chăm sóc thư giãn.
          </p>
        </motion.div>

        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${category === cat.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loadError && (
          <div className="mx-auto mb-6 max-w-2xl rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-center text-sm text-destructive">
            {loadError}
          </div>
        )}

        {isLoading && (
          <div className="mb-6 text-center text-sm text-muted-foreground">Đang tải dịch vụ...</div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="flex h-full flex-col"
            >
              <ServiceCard service={service} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
