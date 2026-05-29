import type { OrderStatus } from '@/types/order';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  createdAt: string;
  deleted: boolean;
  deletedAt?: string;
}

export interface AdminBooking {
  id: string;
  userId: string;
  userName: string;
  serviceId: string;
  serviceName: string;
  barberId: string;
  barberName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'done' | 'cancelled';
  price: number;
}

export interface AdminProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  stock: number;
  category: string;
}

export interface AdminOrder {
  id: string;
  userId: string;
  customerName: string;
  products: { name: string; qty: number; price: number }[];
  totalPrice: number;
  address: string;
  status: OrderStatus;
  createdAt: string;
}

export interface AdminReview {
  id: string;
  userId?: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  reviewType?: 'product' | 'booking';
  bookingId?: string;
  serviceId?: string;
  serviceName?: string;
  barberId?: string;
  barberName?: string;
  orderId?: string;
  productId?: string;
  productName?: string;
  overallRating?: number;
  overallComment?: string;
  barberRating?: number;
  barberComment?: string;
  serviceRating?: number;
  serviceComment?: string;
}

export interface AdminGalleryImage {
  id: string;
  url: string;
  alt: string;
  uploadedAt: string;
}

export interface AdminService {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
  description: string;
}

export interface AdminBarber {
  id: string;
  name: string;
  experience: number;
  avatar: string;
  specialties: string[];
}

export const mockUsers: AdminUser[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', phone: '0901234567', role: 'user', createdAt: '2024-01-15', deleted: false, deletedAt: '' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '0912345678', role: 'admin', createdAt: '2024-01-10', deleted: false, deletedAt: '' },
  { id: '3', name: 'Mike Johnson', email: 'mike@example.com', phone: '0923456789', role: 'user', createdAt: '2024-02-01', deleted: false, deletedAt: '' },
  { id: '4', name: 'Sarah Williams', email: 'sarah@example.com', phone: '0934567890', role: 'user', createdAt: '2024-02-15', deleted: false, deletedAt: '' },
  { id: '5', name: 'Tom Brown', email: 'tom@example.com', phone: '0945678901', role: 'user', createdAt: '2024-03-01', deleted: false, deletedAt: '' },
  { id: '6', name: 'Emily Davis', email: 'emily@example.com', phone: '0956789012', role: 'user', createdAt: '2024-03-10', deleted: false, deletedAt: '' },
  { id: '7', name: 'Chris Wilson', email: 'chris@example.com', phone: '0967890123', role: 'admin', createdAt: '2024-03-15', deleted: false, deletedAt: '' },
  { id: '8', name: 'Lisa Anderson', email: 'lisa@example.com', phone: '0978901234', role: 'user', createdAt: '2024-03-20', deleted: false, deletedAt: '' },
];

export const mockBookings: AdminBooking[] = [
  { id: '1', userId: '1', userName: 'John Doe', serviceId: '1', serviceName: 'Skin Fade', barberId: '1', barberName: 'Marcus Cole', date: '2024-04-01', time: '10:00 AM', status: 'confirmed', price: 35 },
  { id: '2', userId: '3', userName: 'Mike Johnson', serviceId: '2', serviceName: 'Beard Trim', barberId: '2', barberName: 'Jake Rivera', date: '2024-04-01', time: '11:30 AM', status: 'pending', price: 20 },
  { id: '3', userId: '4', userName: 'Sarah Williams', serviceId: '3', serviceName: 'Hair Coloring', barberId: '3', barberName: 'Sofia Chen', date: '2024-04-02', time: '2:00 PM', status: 'confirmed', price: 60 },
  { id: '4', userId: '5', userName: 'Tom Brown', serviceId: '1', serviceName: 'Skin Fade', barberId: '1', barberName: 'Marcus Cole', date: '2024-04-03', time: '9:00 AM', status: 'done', price: 35 },
  { id: '5', userId: '6', userName: 'Emily Davis', serviceId: '4', serviceName: 'Hot Towel Shave', barberId: '2', barberName: 'Jake Rivera', date: '2024-04-03', time: '3:00 PM', status: 'cancelled', price: 30 },
  { id: '6', userId: '8', userName: 'Lisa Anderson', serviceId: '2', serviceName: 'Beard Trim', barberId: '3', barberName: 'Sofia Chen', date: '2024-04-04', time: '10:00 AM', status: 'pending', price: 20 },
  { id: '7', userId: '1', userName: 'John Doe', serviceId: '5', serviceName: 'Classic Cut', barberId: '1', barberName: 'Marcus Cole', date: '2024-04-05', time: '1:00 PM', status: 'confirmed', price: 25 },
  { id: '8', userId: '3', userName: 'Mike Johnson', serviceId: '3', serviceName: 'Hair Coloring', barberId: '2', barberName: 'Jake Rivera', date: '2024-04-05', time: '4:00 PM', status: 'pending', price: 60 },
];

export const mockProducts: AdminProduct[] = [
  { id: '1', name: 'Premium Pomade', price: 24.99, image: '/placeholder.svg', description: 'High-quality styling pomade', stock: 50, category: 'Styling' },
  { id: '2', name: 'Beard Oil', price: 19.99, image: '/placeholder.svg', description: 'Nourishing beard oil', stock: 35, category: 'Beard Care' },
  { id: '3', name: 'Shampoo', price: 14.99, image: '/placeholder.svg', description: 'Gentle daily shampoo', stock: 80, category: 'Hair Care' },
  { id: '4', name: 'Hair Wax', price: 18.99, image: '/placeholder.svg', description: 'Strong hold matte wax', stock: 45, category: 'Styling' },
  { id: '5', name: 'Aftershave Balm', price: 22.99, image: '/placeholder.svg', description: 'Soothing aftershave', stock: 60, category: 'Shaving' },
  { id: '6', name: 'Clay Pomade', price: 21.99, image: '/placeholder.svg', description: 'Natural matte finish', stock: 30, category: 'Styling' },
];

export const mockOrders: AdminOrder[] = [
  { id: '1', userId: '1', customerName: 'John Doe', products: [{ name: 'Premium Pomade', qty: 2, price: 24.99 }, { name: 'Beard Oil', qty: 1, price: 19.99 }], totalPrice: 69.97, address: '123 Main St, NYC', status: 'delivered', createdAt: '2024-03-25' },
  { id: '2', userId: '3', customerName: 'Mike Johnson', products: [{ name: 'Shampoo', qty: 1, price: 14.99 }], totalPrice: 14.99, address: '456 Oak Ave, LA', status: 'shipping', createdAt: '2024-03-28' },
  { id: '3', userId: '4', customerName: 'Sarah Williams', products: [{ name: 'Hair Wax', qty: 1, price: 18.99 }, { name: 'Clay Pomade', qty: 1, price: 21.99 }], totalPrice: 40.98, address: '789 Pine Rd, Chicago', status: 'pending', createdAt: '2024-03-30' },
  { id: '4', userId: '5', customerName: 'Tom Brown', products: [{ name: 'Aftershave Balm', qty: 3, price: 22.99 }], totalPrice: 68.97, address: '321 Elm St, Houston', status: 'delivered', createdAt: '2024-03-20' },
  { id: '5', userId: '6', customerName: 'Emily Davis', products: [{ name: 'Premium Pomade', qty: 1, price: 24.99 }, { name: 'Shampoo', qty: 2, price: 14.99 }], totalPrice: 54.97, address: '654 Birch Ln, Seattle', status: 'pending', createdAt: '2024-04-01' },
];

export const mockReviews: AdminReview[] = [
  { id: '1', userId: '1', userName: 'John Doe', rating: 5, comment: 'Amazing haircut! Best barber in town.', date: '2024-03-20', reviewType: 'booking', bookingId: '4', serviceId: '1', serviceName: 'Skin Fade', barberId: '1', barberName: 'Marcus Cole', overallRating: 5, overallComment: 'Amazing haircut! Best barber in town.', barberRating: 5, barberComment: 'Marcus was sharp and precise.', serviceRating: 5, serviceComment: 'The haircut service was excellent.' },
  { id: '2', userId: '3', userName: 'Mike Johnson', rating: 4, comment: 'Great service, very professional.', date: '2024-03-22', reviewType: 'product', orderId: '2', productId: '3', productName: 'Shampoo' },
  { id: '3', userId: '4', userName: 'Sarah Williams', rating: 5, comment: 'Love the atmosphere and the result!', date: '2024-03-25', reviewType: 'booking', bookingId: '3', serviceId: '3', serviceName: 'Hair Coloring', barberId: '3', barberName: 'Sofia Chen', overallRating: 5, overallComment: 'Love the atmosphere and the result!', barberRating: 5, barberComment: 'Sofia listened carefully.', serviceRating: 5, serviceComment: 'Coloring came out exactly as expected.' },
  { id: '4', userId: '5', userName: 'Tom Brown', rating: 3, comment: 'Good but had to wait a bit long.', date: '2024-03-28', reviewType: 'booking', bookingId: '7', serviceId: '5', serviceName: 'Classic Cut', barberId: '1', barberName: 'Marcus Cole', overallRating: 3, overallComment: 'Good but had to wait a bit long.', barberRating: 4, barberComment: 'Barber did well once started.', serviceRating: 3, serviceComment: 'Service quality was okay.' },
  { id: '5', userId: '6', userName: 'Emily Davis', rating: 5, comment: 'Perfect coloring job, exactly what I wanted!', date: '2024-03-30', reviewType: 'product', orderId: '5', productId: '1', productName: 'Premium Pomade' },
];

export const mockGallery: AdminGalleryImage[] = [
  { id: '1', url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400', alt: 'Fade haircut', uploadedAt: '2024-03-01' },
  { id: '2', url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400', alt: 'Classic cut', uploadedAt: '2024-03-05' },
  { id: '3', url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400', alt: 'Beard styling', uploadedAt: '2024-03-10' },
  { id: '4', url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400', alt: 'Modern style', uploadedAt: '2024-03-15' },
  { id: '5', url: 'https://images.unsplash.com/photo-1585747860019-8e8ef2e6d2e5?w=400', alt: 'Hair coloring', uploadedAt: '2024-03-20' },
  { id: '6', url: 'https://images.unsplash.com/photo-1596728325488-58c87691e9af?w=400', alt: 'Pompadour', uploadedAt: '2024-03-25' },
];

export const mockServices: AdminService[] = [
  { id: '1', name: 'Skin Fade', price: 35, duration: 45, category: 'Haircut', description: 'Clean skin fade with sharp lines' },
  { id: '2', name: 'Beard Trim', price: 20, duration: 20, category: 'Grooming', description: 'Professional beard shaping' },
  { id: '3', name: 'Hair Coloring', price: 60, duration: 90, category: 'Coloring', description: 'Full hair coloring service' },
  { id: '4', name: 'Hot Towel Shave', price: 30, duration: 30, category: 'Grooming', description: 'Classic hot towel shave' },
  { id: '5', name: 'Classic Cut', price: 25, duration: 30, category: 'Haircut', description: 'Traditional scissors cut' },
  { id: '6', name: 'Kids Cut', price: 18, duration: 20, category: 'Haircut', description: 'Haircut for children under 12' },
];

export const mockBarbers: AdminBarber[] = [
  { id: '1', name: 'Marcus Cole', experience: 8, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', specialties: ['Fade', 'Classic'] },
  { id: '2', name: 'Jake Rivera', experience: 5, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', specialties: ['Beard', 'Modern'] },
  { id: '3', name: 'Sofia Chen', experience: 6, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', specialties: ['Coloring', 'Styling'] },
];

export const revenueData = [
  { month: 'Jan', revenue: 4200, bookings: 85 },
  { month: 'Feb', revenue: 5100, bookings: 102 },
  { month: 'Mar', revenue: 4800, bookings: 96 },
  { month: 'Apr', revenue: 6200, bookings: 124 },
  { month: 'May', revenue: 5900, bookings: 118 },
  { month: 'Jun', revenue: 7100, bookings: 142 },
];

export const dashboardStats = {
  totalBookings: 667,
  totalRevenue: 33300,
  totalUsers: 1245,
  totalOrders: 389,
  bookingGrowth: 12.5,
  revenueGrowth: 8.3,
  userGrowth: 15.2,
  orderGrowth: 6.7,
};
