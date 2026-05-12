import type { Service, Barber, Product, Review, GalleryImage } from '@/data/mockData';
import type {
  AdminBarber,
  AdminBooking,
  AdminGalleryImage,
  AdminOrder,
  AdminProduct,
  AdminReview,
  AdminService,
  AdminUser,
} from '@/data/adminMockData';
import { dispatchUnauthorizedEvent } from '@/lib/auth-events';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8081';

const getToken = () => localStorage.getItem('cutie_cuts_token');

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface Booking {
  id: string;
  userId?: string;
  userName?: string;
  serviceId?: string;
  serviceName: string;
  barberId?: string;
  barberName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'done' | 'cancelled' | string;
  price?: number;
  duration?: number;
}

type ServiceRow = { id: number; name: string; description: string; price: number; duration: number; category: string };
type BarberRow = { id: number; name: string; role: string; image: string; experience: number; specialties: string; rating: number };
type ProductRow = { id: number; name: string; price: number; image: string; rating: number; category: string; description: string };
type BookingRow = {
  id: number;
  userId?: number;
  userName?: string;
  serviceId?: number;
  serviceName: string;
  barberId?: number;
  barberName: string;
  date: string;
  time: string;
  status: Booking['status'];
  price?: number;
  duration?: number;
};

async function request<T>(path: string, init?: RequestInit, auth = false): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  headers.set('Content-Type', 'application/json');

  if (auth) {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (auth && response.status === 401) {
    dispatchUnauthorizedEvent();
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json() as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // ignore
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return await response.json() as T;
}

async function requestWithNotFoundFallback<T>(path: string, fallbackPath: string, init?: RequestInit, auth = false): Promise<T> {
  try {
    return await request<T>(path, init, auth);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return await request<T>(fallbackPath, init, auth);
    }
    throw error;
  }
}

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
};

const mapService = (row: ServiceRow): Service => ({
  id: String(row.id),
  nameKey: '',
  descKey: '',
  name: row.name,
  description: row.description,
  price: row.price,
  duration: row.duration,
  category: row.category as Service['category'],
});

const mapBarber = (row: BarberRow): Barber => ({
  id: String(row.id),
  name: row.name,
  role: row.role,
  image: row.image,
  experience: row.experience,
  specialties: row.specialties ? row.specialties.split(',').map((s) => s.trim()).filter(Boolean) : [],
  rating: row.rating,
});

const mapProduct = (row: ProductRow): Product => ({
  id: String(row.id),
  name: row.name,
  price: row.price,
  image: row.image,
  rating: row.rating,
  category: row.category,
  description: row.description,
});

const mapBooking = (row: BookingRow): Booking => ({
  id: String(row.id),
  userId: row.userId === undefined ? undefined : String(row.userId),
  userName: row.userName,
  serviceId: row.serviceId === undefined ? undefined : String(row.serviceId),
  serviceName: row.serviceName,
  barberId: row.barberId === undefined ? undefined : String(row.barberId),
  barberName: row.barberName,
  date: row.date,
  time: row.time,
  status: row.status,
  price: row.price,
  duration: row.duration,
});

export const api = {
  getServices: async (): Promise<Service[]> => {
    const rows = await request<Array<{ id: number; name: string; description: string; price: number; duration: number; category: string }>>('/api/services');
    return rows.map((row) => ({
      id: String(row.id),
      nameKey: '',
      descKey: '',
      name: row.name,
      description: row.description,
      price: row.price,
      duration: row.duration,
      category: row.category as Service['category'],
    }));
  },

  getBarbers: async (): Promise<Barber[]> => {
    const rows = await request<Array<{ id: number; name: string; role: string; image: string; experience: number; specialties: string; rating: number }>>('/api/barbers');
    return rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      role: row.role,
      image: row.image,
      experience: row.experience,
      specialties: row.specialties ? row.specialties.split(',').map((s) => s.trim()).filter(Boolean) : [],
      rating: row.rating,
    }));
  },

  getProducts: async (): Promise<Product[]> => {
    const rows = await request<Array<{ id: number; name: string; price: number; image: string; rating: number; category: string; description: string }>>('/api/products');
    return rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      price: row.price,
      image: row.image,
      rating: row.rating,
      category: row.category,
      description: row.description,
    }));
  },

  getReviews: async (): Promise<Review[]> => {
    const rows = await request<Array<{ id: number; userName: string; rating: number; comment: string; date: string }>>('/api/reviews');
    return rows.map((row) => ({
      id: String(row.id),
      name: row.userName,
      rating: row.rating,
      commentKey: '',
      comment: row.comment,
      date: row.date,
      avatar: initials(row.userName),
    }));
  },

  getGallery: async (): Promise<GalleryImage[]> => {
    const rows = await request<Array<{ id: number; url: string; alt: string; category: string }>>('/api/gallery');
    return rows.map((row) => ({
      id: String(row.id),
      src: row.url,
      alt: row.alt,
      category: row.category as GalleryImage['category'],
    }));
  },

  createBooking: async (payload: { serviceId: number; barberId: number; date: string; time: string }) => {
    return request('/api/bookings', { method: 'POST', body: JSON.stringify(payload) }, true);

  },

  createOrder: async (payload: { address: string; items: Array<{ productId: number; quantity: number }> }) => {
    return request('/api/orders', { method: 'POST', body: JSON.stringify(payload) }, true);
  },

  services: {
    getAll: async (): Promise<Service[]> => {
      const rows = await request<ServiceRow[]>('/api/services');
      return rows.map(mapService);
    },
  },

  barbers: {
    getAll: async (): Promise<Barber[]> => {
      const rows = await request<BarberRow[]>('/api/barbers');
      return rows.map(mapBarber);
    },
  },

  products: {
    getAll: async (): Promise<Product[]> => {
      const rows = await request<ProductRow[]>('/api/products');
      return rows.map(mapProduct);
    },
  },

  bookings: {
    getMine: async (): Promise<Booking[]> => {
      const rows = await requestWithNotFoundFallback<BookingRow[]>('/api/bookings/my', '/bookings/my', undefined, true);
      return rows.map(mapBooking);
    },
    create: async (payload: { serviceId: number; barberId: number; date: string; time: string }): Promise<Booking> => {
      const row = await requestWithNotFoundFallback<BookingRow>('/api/bookings', '/bookings', { method: 'POST', body: JSON.stringify(payload) }, true);
      return mapBooking(row);
    },
    cancel: async (id: string): Promise<Booking> => {
      const row = await requestWithNotFoundFallback<BookingRow>(`/api/bookings/${id}/status`, `/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled' }) }, true);
      return mapBooking(row);
    },
  },

  admin: {
    getServices: async (): Promise<AdminService[]> => {
      const rows = await request<Array<{ id: number; name: string; category: string; price: number; duration: number; description: string }>>('/api/services');
      return rows.map((r) => ({ id: String(r.id), name: r.name, category: r.category, price: r.price, duration: r.duration, description: r.description }));
    },
    createService: async (payload: Omit<AdminService, 'id'>) => request('/api/services', { method: 'POST', body: JSON.stringify(payload) }),
    updateService: async (id: string, payload: Omit<AdminService, 'id'>) => request(`/api/services/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteService: async (id: string) => request(`/api/services/${id}`, { method: 'DELETE' }),

    getProducts: async (): Promise<AdminProduct[]> => {
      const rows = await request<Array<{ id: number; name: string; category: string; price: number; stock: number; image: string; description: string }>>('/api/products');
      return rows.map((r) => ({ id: String(r.id), name: r.name, category: r.category, price: r.price, stock: r.stock, image: r.image, description: r.description }));
    },
    createProduct: async (payload: Omit<AdminProduct, 'id'>) => request('/api/products', { method: 'POST', body: JSON.stringify(payload) }),
    updateProduct: async (id: string, payload: Omit<AdminProduct, 'id'>) => request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteProduct: async (id: string) => request(`/api/products/${id}`, { method: 'DELETE' }),

    getBarbers: async (): Promise<AdminBarber[]> => {
      const rows = await request<Array<{ id: number; name: string; experience: number; image: string; specialties: string }>>('/api/barbers');
      return rows.map((r) => ({ id: String(r.id), name: r.name, experience: r.experience, avatar: r.image, specialties: r.specialties ? r.specialties.split(',').map((s) => s.trim()) : [] }));
    },
    createBarber: async (payload: Omit<AdminBarber, 'id'>) => {
      const body = { ...payload, image: payload.avatar, specialties: payload.specialties.join(','), role: 'Barber', rating: 4.8 };
      return request('/api/barbers', { method: 'POST', body: JSON.stringify(body) });
    },
    updateBarber: async (id: string, payload: Omit<AdminBarber, 'id'>) => {
      const body = { ...payload, image: payload.avatar, specialties: payload.specialties.join(','), role: 'Barber', rating: 4.8 };
      return request(`/api/barbers/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    },
    deleteBarber: async (id: string) => request(`/api/barbers/${id}`, { method: 'DELETE' }),

    getBookings: async (): Promise<AdminBooking[]> => {
      const rows = await request<Array<{ id: number; userId: number; userName: string; serviceId: number; serviceName: string; barberId: number; barberName: string; date: string; time: string; status: AdminBooking['status']; price: number }>>('/api/bookings');
      return rows.map((r) => ({ ...r, id: String(r.id), userId: String(r.userId), serviceId: String(r.serviceId), barberId: String(r.barberId) }));
    },
    updateBookingStatus: async (id: string, status: AdminBooking['status']) => request(`/api/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

    getOrders: async (): Promise<AdminOrder[]> => {
      const rows = await request<Array<{ id: number; userId: number; customerName: string; products: AdminOrder['products']; totalPrice: number; address: string; status: AdminOrder['status']; createdAt: string }>>('/api/orders');
      return rows.map((r) => ({ ...r, id: String(r.id), userId: String(r.userId) }));
    },
    updateOrderStatus: async (id: string, status: AdminOrder['status']) => request(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

    getReviews: async (): Promise<AdminReview[]> => {
      const rows = await request<Array<{ id: number; userName: string; rating: number; comment: string; date: string }>>('/api/reviews');
      return rows.map((r) => ({ ...r, id: String(r.id) }));
    },
    deleteReview: async (id: string) => request(`/api/reviews/${id}`, { method: 'DELETE' }),

    getGallery: async (): Promise<AdminGalleryImage[]> => {
      const rows = await request<Array<{ id: number; url: string; alt: string; uploadedAt: string }>>('/api/gallery');
      return rows.map((r) => ({ ...r, id: String(r.id), uploadedAt: r.uploadedAt?.slice(0, 10) ?? '' }));
    },
    createGalleryImage: async (payload: { url: string; alt: string }) => request('/api/gallery', { method: 'POST', body: JSON.stringify({ ...payload, category: 'modern' }) }),
    deleteGalleryImage: async (id: string) => request(`/api/gallery/${id}`, { method: 'DELETE' }),

    getUsers: async (): Promise<AdminUser[]> => {
      const rows = await request<Array<{ id: number; name: string; email: string; phone: string; role: 'user' | 'admin'; createdAt: string; deleted: boolean; deletedAt: string }>>('/api/users', undefined, true);
      return rows.map((r) => ({ ...r, id: String(r.id), role: (r.role ?? 'user') as 'user' | 'admin' }));
    },
    updateUser: async (id: string, payload: { name: string; phone: string }) => request(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, true),
    updateUserRole: async (id: string, role: 'user' | 'admin') => request(`/api/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }, true),
    deleteUser: async (id: string) => request(`/api/users/${id}`, { method: 'DELETE' }, true),
  },
};
