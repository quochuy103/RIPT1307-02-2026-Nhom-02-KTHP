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
import { API_BASE_HAS_API_PREFIX, API_BASE_URL, API_DEBUG } from '@/lib/runtime-config';
import type { OrderStatus, OrderStatusUpdate } from '@/types/order';
import { getServiceI18nMeta } from '@/lib/service-i18n';


const getToken = () => localStorage.getItem('cutie_cuts_token');

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
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
  reviewEligible?: boolean;
  reviewSubmitted?: boolean;
  reviewId?: string;
  overallRating?: number;
}

export type ProductReview = Review;

type ServiceRow = { id: number; name: string; description: string; price: number; displayPrice?: string; duration: number; category: string };
type BarberRow = { id: number; name: string; role: string; image: string; experience: number; specialties: string; rating: number };
type ProductRow = { id: number; name: string; price: number; image: string; rating: number; category: string; description: string };
export interface Order {
  id: string;
  /** Numeric id as returned by backend — needed to create a payment */
  numericId: number;
  userId?: string;
  customerName?: string;
  products: { name: string; qty: number; price: number }[];
  totalPrice: number;
  address: string;
  status: OrderStatus;
  createdAt?: string | null;
}

/** Shape of a VietQR payment as returned by the backend */
export interface PaymentInfo {
  id: number;
  paymentCode: string;
  orderId: number;
  amount: number;
  /** Payment status: PENDING | COMPLETED | EXPIRED */
  status: string;
  /** Base64 QR image data URL — use directly as <img src> */
  qrCodeUrl?: string | null;
  /** Raw QR data URL fallback */
  qrDataUrl?: string | null;
  bankAccount?: string | null;
  bankCode?: string | null;
  bankName?: string | null;
  expiredAt?: string | null;
  createdAt?: string | null;
}

export interface UserProfile {
  id: number;
  name: string;
  fullName?: string;
  gender?: 'male' | 'female' | 'other' | string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  role?: 'user' | 'admin' | string | null;
  provider?: string | null;
  accountProvider?: string | null;
  createdAt?: string | null;
}

export interface UpdateUserProfilePayload {
  fullName: string;
  gender?: string | null;
  phone?: string | null;
  address?: string | null;
}

type OrderRow = {
  id: number;
  userId?: number;
  customerName?: string;
  products: { name: string; qty: number; price: number }[];
  totalPrice: number;
  address: string;
  status: Order['status'];
  createdAt: string;
};

type PageResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  page?: number;
  size?: number;
};

export type PaginatedResult<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
};

type QueryPrimitive = string | number | boolean;
type QueryValue = QueryPrimitive | null | undefined | QueryPrimitive[];

type PaginationParams = {
  page?: number;
  size?: number;
  sort?: string[];
};

export type ServiceFilters = PaginationParams & {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
};

export type BarberFilters = PaginationParams & {
  search?: string;
  specialty?: string;
  minExperience?: number;
  maxExperience?: number;
};

export type ProductFilters = PaginationParams & {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
};

export type ReviewFilters = PaginationParams & {
  productId?: number | string;
  serviceId?: number | string;
  barberId?: number | string;
  userId?: number | string;
  orderId?: number | string;
  minRating?: number;
  maxRating?: number;
  createdFrom?: string;
  createdTo?: string;
};

export type GalleryFilters = PaginationParams & {
  category?: string;
  uploadedFrom?: string;
  uploadedTo?: string;
};

export type AdminUsersFilters = PaginationParams & {
  role?: 'user' | 'admin' | 'all' | string;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
};

export type AdminBookingsFilters = PaginationParams & {
  status?: string;
  barberId?: string;
  userId?: string;
  serviceId?: string;
  dateFrom?: string;
  dateTo?: string;
  upcoming?: boolean;
};

export type AdminOrdersFilters = PaginationParams & {
  status?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  minTotal?: number;
  maxTotal?: number;
};

export type AdminPaymentsFilters = PaginationParams & {
  status?: string;
  orderId?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
};

type AdminProductRow = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  description: string;
};

type AdminBarberRow = {
  id: number;
  name: string;
  experience: number;
  image: string;
  specialties: string;
};

type AdminUserRow = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  createdAt: string;
  deleted: boolean;
  deletedAt: string;
};

type AdminReviewRow = {
  id: number;
  userId?: number;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  bookingId?: number;
  serviceId?: number;
  serviceName?: string;
  barberId?: number;
  barberName?: string;
  orderId?: number;
  productId?: number;
  productName?: string;
  reviewType?: 'product' | 'booking';
  overallRating?: number;
  overallComment?: string;
  barberRating?: number;
  barberComment?: string;
  serviceRating?: number;
  serviceComment?: string;
};

type AdminGalleryRow = {
  id: number;
  url: string;
  alt: string;
  uploadedAt: string;
  category?: string;
};



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
  reviewEligible?: boolean;
  reviewSubmitted?: boolean;
  reviewId?: number;
  overallRating?: number;
};

type ReviewableProductRow = {
  orderId: number;
  productId: number;
  productName: string;
  productImage?: string | null;
  quantity: number;
  price: number;
  orderStatus: string;
  orderedAt: string;
};

export type CreateReviewPayload =
  | {
      bookingId: number;
      overall: { rating: number; comment: string };
      barber: { rating: number; comment?: string };
      service: { rating: number; comment?: string };
    }
  | { orderId: number; productId: number; rating: number; comment: string };

export type ReviewableProduct = {
  orderId: string;
  productId: string;
  productName: string;
  productImage?: string | null;
  quantity: number;
  price: number;
  orderStatus: string;
  orderedAt: string;
};

const normalizePath = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (API_BASE_HAS_API_PREFIX && normalizedPath.startsWith('/api/')) {
    return normalizedPath.slice(4);
  }
  return normalizedPath;
};

const getRequestBodyForLog = (init?: RequestInit) => {
  if (!init?.body || typeof init.body !== 'string') return init?.body;
  try {
    return JSON.parse(init.body);
  } catch {
    return init.body;
  }
};

const buildQueryString = (params: Record<string, QueryValue>) => {
  const searchParams = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(params)) {
    if (rawValue === undefined || rawValue === null || rawValue === '') continue;

    if (Array.isArray(rawValue)) {
      for (const value of rawValue) {
        if (value === undefined || value === null || value === '') continue;
        searchParams.append(key, String(value));
      }
      continue;
    }

    searchParams.append(key, String(rawValue));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

const mapPaginatedResponse = <TRow, TItem>(
  page: PageResponse<TRow>,
  mapper: (row: TRow) => TItem,
): PaginatedResult<TItem> => ({
  content: page.content.map(mapper),
  totalPages: page.totalPages,
  totalElements: page.totalElements,
  number: page.number,
  size: page.size ?? page.content.length,
});

const logRequest = (url: string, path: string, init: RequestInit | undefined, headers: Headers) => {
  if (!API_DEBUG) return;
  const method = init?.method ?? 'GET';
  const authHeader = headers.get('Authorization');
  console.debug('[API request]', {
    method,
    url,
    path,
    headers: {
      Authorization: authHeader ? 'Bearer <redacted>' : undefined,
      'Content-Type': headers.get('Content-Type') ?? undefined,
    },
    body: getRequestBodyForLog(init),
  });
};

const logErrorResponse = (url: string, status: number, data: unknown) => {
  if (!API_DEBUG) return;
  const body = data as { message?: unknown; error?: unknown; detail?: unknown; stack?: unknown } | null;
  console.error('[API error]', {
    url,
    status,
    data,
    message: body?.message,
    error: body?.error,
    detail: body?.detail,
    stack: body?.stack,
  });
};

const extractErrorMessage = (body: unknown, status: number) => {
  if (body && typeof body === 'object') {
    const data = body as { message?: unknown; error?: unknown; detail?: unknown; errors?: unknown };
    if (typeof data.message === 'string') {
      if (data.errors && typeof data.errors === 'object') {
        const details = Object.entries(data.errors as Record<string, unknown>)
          .map(([field, message]) => `${field}: ${String(message)}`)
          .join(', ');
        return details ? `${data.message}: ${details}` : data.message;
      }
      return data.message;
    }
    if (typeof data.detail === 'string') return data.detail;
    if (typeof data.error === 'string') return data.error;
  }
  return `Request failed (${status})`;
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

  const normalizedPath = normalizePath(path);
  const url = `${API_BASE_URL}${normalizedPath}`;
  logRequest(url, normalizedPath, init, headers);

  const response = await fetch(url, { ...init, headers });

  if (auth && response.status === 401) {
    dispatchUnauthorizedEvent();
  }

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      try {
        body = await response.text();
      } catch {
        body = undefined;
      }
    }
    logErrorResponse(url, response.status, body);
    throw new ApiError(extractErrorMessage(body, response.status), response.status, body);
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

const mapService = (row: ServiceRow): Service => {
  const meta = getServiceI18nMeta(row.name);

  return {
    id: String(row.id),
    slug: meta?.slug,
    nameKey: meta?.nameKey ?? '',
    descKey: meta?.descKey ?? '',
    name: row.name,
    description: row.description,
    price: row.price,
    displayPrice: row.displayPrice,
    priceLabel: row.displayPrice,
    duration: row.duration,
    category: row.category as Service['category'],
  };
};

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
  reviewEligible: row.reviewEligible,
  reviewSubmitted: row.reviewSubmitted,
  reviewId: row.reviewId === undefined ? undefined : String(row.reviewId),
  overallRating: row.overallRating,
});

const normalizeBookingTimeForSort = (time: string) => {
  if (!time) return '00:00:00';
  return time.length === 5 ? `${time}:00` : time;
};

const compareBookingsBySchedule = <T extends { date: string; time: string; id: string | number }>(a: T, b: T) => {
  const dateCompare = b.date.localeCompare(a.date);
  if (dateCompare !== 0) return dateCompare;

  const timeCompare = normalizeBookingTimeForSort(b.time).localeCompare(normalizeBookingTimeForSort(a.time));
  if (timeCompare !== 0) return timeCompare;

  return Number(b.id) - Number(a.id);
};

const mapOrder = (row: OrderRow): Order => ({
  id: String(row.id),
  numericId: row.id,
  userId: row.userId === undefined ? undefined : String(row.userId),
  customerName: row.customerName,
  products: row.products ?? [],
  totalPrice: row.totalPrice,
  address: row.address,
  status: row.status,
  createdAt: row.createdAt ?? '',
});

export const api = {
  user: {
    getMe: async (): Promise<UserProfile> => request<UserProfile>('/api/user/me', undefined, true),
    updateProfile: async (payload: UpdateUserProfilePayload): Promise<UserProfile> => (
      request<UserProfile>('/api/user/me', { method: 'PATCH', body: JSON.stringify(payload) }, true)
    ),
  },

  services: {
    getAll: async (): Promise<Service[]> => {
      const rows = await request<ServiceRow[]>('/api/services');
      return rows.map(mapService);
    },
    getFiltered: async ({
      page = 0,
      size = 100,
      sort = ['name,asc'],
      ...filters
    }: ServiceFilters = {}): Promise<PaginatedResult<Service>> => {
      const query = buildQueryString({ page, size, sort, ...filters });
      const rows = await request<PageResponse<ServiceRow>>(`/api/services/page${query}`);
      return mapPaginatedResponse(rows, mapService);
    },
  },

  barbers: {
    getAll: async (): Promise<Barber[]> => {
      const rows = await request<BarberRow[]>('/api/barbers');
      return rows.map(mapBarber);
    },
    getFiltered: async ({
      page = 0,
      size = 100,
      sort = ['name,asc'],
      ...filters
    }: BarberFilters = {}): Promise<PaginatedResult<Barber>> => {
      const query = buildQueryString({ page, size, sort, ...filters });
      const rows = await request<PageResponse<BarberRow>>(`/api/barbers/paginated${query}`);
      return mapPaginatedResponse(rows, mapBarber);
    },
  },

  products: {
    getAll: async (): Promise<Product[]> => {
      const rows = await request<ProductRow[]>('/api/products');
      return rows.map(mapProduct);
    },
    getFiltered: async ({
      page = 0,
      size = 100,
      sort = ['name,asc'],
      ...filters
    }: ProductFilters = {}): Promise<PaginatedResult<Product>> => {
      const query = buildQueryString({ page, size, sort, ...filters });
      const rows = await request<PageResponse<ProductRow>>(`/api/products/page${query}`);
      return mapPaginatedResponse(rows, mapProduct);
    },
    getById: async (id: string | number): Promise<Product> => {
      const row = await request<ProductRow>(`/api/products/${id}`);
      return mapProduct(row);
    },
  },

  reviews: {
    getAll: async (): Promise<Review[]> => {
      const rows = await request<Array<{
        id: number;
        userName: string;
        rating: number;
        comment: string;
        date: string;
        userId?: number;
        bookingId?: number;
        serviceId?: number;
        serviceName?: string;
        barberId?: number;
        barberName?: string;
        orderId?: number;
        productId?: number;
        productName?: string;
        reviewType?: 'product' | 'booking';
        overallRating?: number;
        overallComment?: string;
        barberRating?: number;
        barberComment?: string;
        serviceRating?: number;
        serviceComment?: string;
      }>>('/api/reviews');
      return rows.map((row) => ({
        id: String(row.id),
        name: row.userName || 'Anonymous',
        rating: row.rating,
        commentKey: '',
        comment: row.comment,
        date: row.date || '',
        avatar: initials(row.userName || 'Anonymous'),
        userId: row.userId ? String(row.userId) : undefined,
        bookingId: row.bookingId ? String(row.bookingId) : undefined,
        serviceId: row.serviceId ? String(row.serviceId) : undefined,
        serviceName: row.serviceName,
        barberId: row.barberId ? String(row.barberId) : undefined,
        barberName: row.barberName,
        orderId: row.orderId ? String(row.orderId) : undefined,
        productId: row.productId ? String(row.productId) : undefined,
        productName: row.productName,
        reviewType: row.reviewType,
        overallRating: row.overallRating,
        overallComment: row.overallComment,
        barberRating: row.barberRating,
        barberComment: row.barberComment,
        serviceRating: row.serviceRating,
        serviceComment: row.serviceComment,
      }));
    },
    getMyReviews: async (): Promise<Review[]> => {
      const rows = await request<Array<{
        id: number;
        userName: string;
        rating: number;
        comment: string;
        date: string;
        userId?: number;
        bookingId?: number;
        serviceId?: number;
        serviceName?: string;
        barberId?: number;
        barberName?: string;
        orderId?: number;
        productId?: number;
        productName?: string;
        reviewType?: 'product' | 'booking';
        overallRating?: number;
        overallComment?: string;
        barberRating?: number;
        barberComment?: string;
        serviceRating?: number;
        serviceComment?: string;
      }>>('/api/reviews/me', undefined, true);
      return rows.map((row) => ({
        id: String(row.id),
        name: row.userName || 'Anonymous',
        rating: row.rating,
        commentKey: '',
        comment: row.comment,
        date: row.date || '',
        avatar: initials(row.userName || 'Anonymous'),
        userId: row.userId ? String(row.userId) : undefined,
        bookingId: row.bookingId ? String(row.bookingId) : undefined,
        serviceId: row.serviceId ? String(row.serviceId) : undefined,
        serviceName: row.serviceName,
        barberId: row.barberId ? String(row.barberId) : undefined,
        barberName: row.barberName,
        orderId: row.orderId ? String(row.orderId) : undefined,
        productId: row.productId ? String(row.productId) : undefined,
        productName: row.productName,
        reviewType: row.reviewType,
        overallRating: row.overallRating,
        overallComment: row.overallComment,
        barberRating: row.barberRating,
        barberComment: row.barberComment,
        serviceRating: row.serviceRating,
        serviceComment: row.serviceComment,
      }));
    },
    getProductReviews: async (productId: string | number): Promise<Review[]> => {
      const rows = await request<Array<{
        id: number;
        userName: string;
        rating: number;
        comment: string;
        date: string;
        userId?: number;
        bookingId?: number;
        serviceId?: number;
        serviceName?: string;
        barberId?: number;
        barberName?: string;
        orderId?: number;
        productId?: number;
        productName?: string;
        reviewType?: 'product' | 'booking';
        overallRating?: number;
        overallComment?: string;
        barberRating?: number;
        barberComment?: string;
        serviceRating?: number;
        serviceComment?: string;
      }>>(`/api/reviews/products/${productId}`);
      return rows.map((row) => ({
        id: String(row.id),
        name: row.userName || 'Anonymous',
        rating: row.rating,
        commentKey: '',
        comment: row.comment,
        date: row.date || '',
        avatar: initials(row.userName || 'Anonymous'),
        userId: row.userId ? String(row.userId) : undefined,
        bookingId: row.bookingId ? String(row.bookingId) : undefined,
        serviceId: row.serviceId ? String(row.serviceId) : undefined,
        serviceName: row.serviceName,
        barberId: row.barberId ? String(row.barberId) : undefined,
        barberName: row.barberName,
        orderId: row.orderId ? String(row.orderId) : undefined,
        productId: row.productId ? String(row.productId) : undefined,
        productName: row.productName,
        reviewType: row.reviewType,
        overallRating: row.overallRating,
        overallComment: row.overallComment,
        barberRating: row.barberRating,
        barberComment: row.barberComment,
        serviceRating: row.serviceRating,
        serviceComment: row.serviceComment,
      }));
    },

    getReviewableProducts: async (): Promise<ReviewableProduct[]> => {
      const rows = await request<ReviewableProductRow[]>('/api/reviews/me/reviewable-products', undefined, true);
      return rows.map((row) => ({
        ...row,
        orderId: String(row.orderId),
        productId: String(row.productId),
      }));
    },
    getFiltered: async ({
      page = 0,
      size = 100,
      sort = ['createdAt,desc'],
      ...filters
    }: ReviewFilters = {}): Promise<PaginatedResult<Review>> => {
      const query = buildQueryString({ page, size, sort, ...filters });
      const rows = await request<PageResponse<{
        id: number;
        userName: string;
        rating: number;
        comment: string;
        date: string;
        userId?: number;
        bookingId?: number;
        serviceId?: number;
        serviceName?: string;
        barberId?: number;
        barberName?: string;
        orderId?: number;
        productId?: number;
        productName?: string;
        reviewType?: 'product' | 'booking';
        overallRating?: number;
        overallComment?: string;
        barberRating?: number;
        barberComment?: string;
        serviceRating?: number;
        serviceComment?: string;
      }>>(`/api/reviews/page${query}`);
      return mapPaginatedResponse(rows, (row) => ({
        id: String(row.id),
        name: row.userName || 'Anonymous',
        rating: row.rating,
        commentKey: '',
        comment: row.comment,
        date: row.date || '',
        avatar: initials(row.userName || 'Anonymous'),
        userId: row.userId ? String(row.userId) : undefined,
        bookingId: row.bookingId ? String(row.bookingId) : undefined,
        serviceId: row.serviceId ? String(row.serviceId) : undefined,
        serviceName: row.serviceName,
        barberId: row.barberId ? String(row.barberId) : undefined,
        barberName: row.barberName,
        orderId: row.orderId ? String(row.orderId) : undefined,
        productId: row.productId ? String(row.productId) : undefined,
        productName: row.productName,
        reviewType: row.reviewType,
        overallRating: row.overallRating,
        overallComment: row.overallComment,
        barberRating: row.barberRating,
        barberComment: row.barberComment,
        serviceRating: row.serviceRating,
        serviceComment: row.serviceComment,
      }));
    },
    create: async (payload: CreateReviewPayload) => {
      if ('bookingId' in payload) {
        const ratings = [payload.overall.rating, payload.barber.rating, payload.service.rating];
        if (ratings.some((rating) => !Number.isInteger(rating) || rating < 1 || rating > 5)) {
          throw new ApiError('All booking review ratings must be between 1 and 5', 400, payload);
        }
        if (!payload.overall.comment.trim()) {
          throw new ApiError('Overall comment is required', 400, payload);
        }
      } else if (!Number.isInteger(payload.rating) || payload.rating < 1 || payload.rating > 5) {
        throw new ApiError('Rating must be between 1 and 5', 400, payload);
      }
      return request('/api/reviews', { method: 'POST', body: JSON.stringify(payload) }, true);
    },
  },

  gallery: {
    getAll: async (): Promise<GalleryImage[]> => {
      const rows = await request<Array<{ id: number; url: string; alt: string; category: string }>>('/api/gallery');
      return rows.map((row) => ({
        id: String(row.id),
        src: row.url,
        alt: row.alt,
        category: row.category as GalleryImage['category'],
      }));
    },
    getFiltered: async ({
      page = 0,
      size = 100,
      sort = ['uploadedAt,desc'],
      ...filters
    }: GalleryFilters = {}): Promise<PaginatedResult<GalleryImage>> => {
      const query = buildQueryString({ page, size, sort, ...filters });
      const rows = await request<PageResponse<{ id: number; url: string; alt: string; category: string }>>(`/api/gallery/page${query}`);
      return mapPaginatedResponse(rows, (row) => ({
        id: String(row.id),
        src: row.url,
        alt: row.alt,
        category: row.category as GalleryImage['category'],
      }));
    },
  },

  bookings: {
    getMine: async (status?: string): Promise<Booking[]> => {
      const query = buildQueryString({
        page: 0,
        size: 100,
        sort: ['date,desc', 'time,desc', 'createdAt,desc'],
        status,
      });
      const page = await requestWithNotFoundFallback<PageResponse<BookingRow> | BookingRow[]>(
        `/api/user/me/bookings${query}`,
        '/bookings/my',
        undefined,
        true,
      );
      const rows = Array.isArray(page) ? page : page.content;
      const bookings = rows.map(mapBooking).sort(compareBookingsBySchedule);
      if (!status) return bookings;
      return bookings.filter((booking) => booking.status.toLowerCase() === status.toLowerCase());
    },
    create: async (payload: { serviceId: number; barberId: number; date: string; time: string }): Promise<Booking> => {
      if (!Number.isFinite(payload.serviceId) || !Number.isFinite(payload.barberId) || !payload.date || !payload.time) {
        console.error('[API validation]', { endpoint: 'create booking', payload });
        throw new ApiError('Invalid booking payload. Required: serviceId, barberId, date, time', 400, payload);
      }
      const row = await requestWithNotFoundFallback<BookingRow>('/bookings', '/api/bookings', { method: 'POST', body: JSON.stringify(payload) }, true);
      return mapBooking(row);
    },
    cancel: async (id: string): Promise<Booking> => {
      if (!id || id === 'undefined' || id === 'null') {
        throw new ApiError('Invalid booking id for cancellation', 400, { id });
      }
      const row = await requestWithNotFoundFallback<BookingRow>(`/bookings/${id}/cancel`, `/api/bookings/${id}/cancel`, { method: 'POST' }, true);
      return mapBooking(row);
    },
  },

  orders: {
    getMyOrders: async (): Promise<Order[]> => {
      const rows = await request<OrderRow[]>('/api/orders/my', undefined, true);
      return rows.map(mapOrder);
    },
    getMyOrdersPaged: async (
      page: number,
      size = 10,
      status?: string,
    ): Promise<PaginatedResult<Order>> => {
      const query = buildQueryString({ page, size, sort: ['createdAt,desc'], status });
      const raw = await request<PageResponse<OrderRow>>(`/api/user/me/orders${query}`, undefined, true);
      return mapPaginatedResponse(raw, mapOrder);
    },
    create: async (payload: { address: string; items: Array<{ productId: number; quantity: number }> }): Promise<Order> => {
      const row = await request<OrderRow>('/api/orders', { method: 'POST', body: JSON.stringify(payload) }, true);
      return mapOrder(row);
    },
  },

  payments: {
    create: async (orderId: number): Promise<PaymentInfo> =>
      request<PaymentInfo>('/api/payments', { method: 'POST', body: JSON.stringify({ orderId }) }, true),
    getByCode: async (paymentCode: string): Promise<PaymentInfo> =>
      request<PaymentInfo>(`/api/payments/${paymentCode}`, undefined, true),
    getMyPayments: async (): Promise<PaymentInfo[]> =>
      request<PaymentInfo[]>('/api/payments/my-payments', undefined, true),
  },

  admin: {
    getServices: async (): Promise<AdminService[]> => {
      const rows = await request<Array<{ id: number; name: string; category: string; price: number; duration: number; description: string }>>('/api/services', undefined, true);
      return rows.map((r) => ({ id: String(r.id), name: r.name, category: r.category, price: r.price, duration: r.duration, description: r.description }));
    },
    createService: async (payload: Omit<AdminService, 'id'>) => request('/api/services', { method: 'POST', body: JSON.stringify(payload) }, true),
    updateService: async (id: string, payload: Omit<AdminService, 'id'>) => request(`/api/services/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, true),
    deleteService: async (id: string) => request(`/api/services/${id}`, { method: 'DELETE' }, true),
    getServicesFiltered: async ({
      page = 0,
      size = 100,
      sort = ['name,asc'],
      ...filters
    }: ServiceFilters = {}): Promise<PaginatedResult<AdminService>> => {
      const query = buildQueryString({ page, size, sort, ...filters });
      const rows = await request<PageResponse<ServiceRow>>(`/api/services/page${query}`, undefined, true);
      return mapPaginatedResponse(rows, (r) => ({
        id: String(r.id),
        name: r.name,
        category: r.category,
        price: r.price,
        duration: r.duration,
        description: r.description,
      }));
    },

    getProducts: async (): Promise<AdminProduct[]> => {
      const rows = await request<Array<{ id: number; name: string; category: string; price: number; stock: number; image: string; description: string }>>('/api/products', undefined, true);
      return rows.map((r) => ({ id: String(r.id), name: r.name, category: r.category, price: r.price, stock: r.stock, image: r.image, description: r.description }));
    },
    createProduct: async (payload: Omit<AdminProduct, 'id'> & { objectKey?: string; contentType?: string; fileSize?: number }) => request('/api/products', { method: 'POST', body: JSON.stringify(payload) }, true),
    updateProduct: async (id: string, payload: Omit<AdminProduct, 'id'> & { objectKey?: string; contentType?: string; fileSize?: number }) => request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, true),
    deleteProduct: async (id: string) => request(`/api/products/${id}`, { method: 'DELETE' }, true),
    getProductsFiltered: async ({
      page = 0,
      size = 100,
      sort = ['name,asc'],
      ...filters
    }: ProductFilters = {}): Promise<PaginatedResult<AdminProduct>> => {
      const query = buildQueryString({ page, size, sort, ...filters });
      const rows = await request<PageResponse<AdminProductRow>>(`/api/products/page${query}`, undefined, true);
      return mapPaginatedResponse(rows, (r) => ({
        id: String(r.id),
        name: r.name,
        category: r.category,
        price: r.price,
        stock: r.stock,
        image: r.image,
        description: r.description,
      }));
    },

    getBarbers: async (): Promise<AdminBarber[]> => {
      const rows = await request<Array<{ id: number; name: string; experience: number; image: string; specialties: string }>>('/api/barbers', undefined, true);
      return rows.map((r) => ({ id: String(r.id), name: r.name, experience: r.experience, avatar: r.image, specialties: r.specialties ? r.specialties.split(',').map((s) => s.trim()) : [] }));
    },
    createBarber: async (payload: Omit<AdminBarber, 'id'> & { objectKey?: string; contentType?: string; fileSize?: number }) => {
      const body = { name: payload.name, experience: payload.experience, image: payload.avatar, specialties: payload.specialties.join(','), role: 'Barber', rating: 4.8, objectKey: payload.objectKey, contentType: payload.contentType, fileSize: payload.fileSize };
      return request('/api/barbers', { method: 'POST', body: JSON.stringify(body) }, true);
    },
    updateBarber: async (id: string, payload: Omit<AdminBarber, 'id'> & { objectKey?: string; contentType?: string; fileSize?: number }) => {
      const body = { name: payload.name, experience: payload.experience, image: payload.avatar, specialties: payload.specialties.join(','), role: 'Barber', rating: 4.8, objectKey: payload.objectKey, contentType: payload.contentType, fileSize: payload.fileSize };
      return request(`/api/barbers/${id}`, { method: 'PUT', body: JSON.stringify(body) }, true);
    },
    deleteBarber: async (id: string) => request(`/api/barbers/${id}`, { method: 'DELETE' }, true),
    getBarbersFiltered: async ({
      page = 0,
      size = 100,
      sort = ['name,asc'],
      ...filters
    }: BarberFilters = {}): Promise<PaginatedResult<AdminBarber>> => {
      const query = buildQueryString({ page, size, sort, ...filters });
      const rows = await request<PageResponse<AdminBarberRow>>(`/api/barbers/paginated${query}`, undefined, true);
      return mapPaginatedResponse(rows, (r) => ({
        id: String(r.id),
        name: r.name,
        experience: r.experience,
        avatar: r.image,
        specialties: r.specialties ? r.specialties.split(',').map((s) => s.trim()).filter(Boolean) : [],
      }));
    },

    getBookings: async (): Promise<AdminBooking[]> => {
      const rows = await requestWithNotFoundFallback<Array<{ id: number; userId: number; userName: string; serviceId: number; serviceName: string; barberId: number; barberName: string; date: string; time: string; status: AdminBooking['status']; price: number }>>('/bookings', '/api/bookings', undefined, true);
      return rows
        .map((r) => ({ ...r, id: String(r.id), userId: String(r.userId), serviceId: String(r.serviceId), barberId: String(r.barberId) }))
        .sort(compareBookingsBySchedule);
    },
    updateBookingStatus: async (id: string, status: AdminBooking['status']) => requestWithNotFoundFallback(`/bookings/${id}/status`, `/api/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, true),
    getBookingsFiltered: async ({
      page = 0,
      size = 100,
      sort = ['date,desc', 'time,desc'],
      ...filters
    }: AdminBookingsFilters = {}): Promise<PaginatedResult<AdminBooking>> => {
      const query = buildQueryString({ page, size, sort, ...filters });
      const rows = await requestWithNotFoundFallback<PageResponse<{
        id: number;
        userId: number;
        userName: string;
        serviceId: number;
        serviceName: string;
        barberId: number;
        barberName: string;
        date: string;
        time: string;
        status: AdminBooking['status'];
        price: number;
      }>>(`/bookings/page${query}`, `/api/bookings/page${query}`, undefined, true);
      const mapped = mapPaginatedResponse(rows, (r) => ({
        ...r,
        id: String(r.id),
        userId: String(r.userId),
        serviceId: String(r.serviceId),
        barberId: String(r.barberId),
      }));
      return {
        ...mapped,
        content: mapped.content.sort(compareBookingsBySchedule),
      };
    },

    getOrders: async (): Promise<AdminOrder[]> => {
      const rows = await request<Array<{ id: number; userId: number; customerName: string; products: AdminOrder['products']; totalPrice: number; address: string; status: AdminOrder['status']; createdAt: string }>>('/api/orders', undefined, true);
      return rows.map((r) => ({ ...r, id: String(r.id), userId: String(r.userId) }));
    },
    updateOrderStatus: async (id: string, status: OrderStatusUpdate) => request(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, true),
    getOrdersFiltered: async ({
      page = 0,
      size = 100,
      sort = ['createdAt,desc'],
      ...filters
    }: AdminOrdersFilters = {}): Promise<PaginatedResult<AdminOrder>> => {
      const query = buildQueryString({ page, size, sort, ...filters });
      const rows = await request<PageResponse<{
        id: number;
        userId: number;
        customerName: string;
        products: AdminOrder['products'];
        totalPrice: number;
        address: string;
        status: AdminOrder['status'];
        createdAt: string;
      }>>(`/api/orders/page${query}`, undefined, true);
      return mapPaginatedResponse(rows, (r) => ({ ...r, id: String(r.id), userId: String(r.userId) }));
    },

    getReviews: async (): Promise<AdminReview[]> => {
      const rows = await request<AdminReviewRow[]>('/api/reviews');
      return rows.map((row) => ({
        ...row,
        id: String(row.id),
        userId: row.userId === undefined ? undefined : String(row.userId),
        bookingId: row.bookingId === undefined ? undefined : String(row.bookingId),
        serviceId: row.serviceId === undefined ? undefined : String(row.serviceId),
        barberId: row.barberId === undefined ? undefined : String(row.barberId),
        orderId: row.orderId === undefined ? undefined : String(row.orderId),
        productId: row.productId === undefined ? undefined : String(row.productId),
      }));
    },
    deleteReview: async (id: string) => request(`/api/reviews/${id}`, { method: 'DELETE' }),
    getReviewsFiltered: async ({
      page = 0,
      size = 100,
      sort = ['createdAt,desc'],
      ...filters
    }: ReviewFilters = {}): Promise<PaginatedResult<AdminReview>> => {
      const query = buildQueryString({ page, size, sort, ...filters });
      const rows = await request<PageResponse<AdminReviewRow>>(`/api/reviews/page${query}`, undefined, true);
      return mapPaginatedResponse(rows, (row) => ({
        ...row,
        id: String(row.id),
        userId: row.userId === undefined ? undefined : String(row.userId),
        bookingId: row.bookingId === undefined ? undefined : String(row.bookingId),
        serviceId: row.serviceId === undefined ? undefined : String(row.serviceId),
        barberId: row.barberId === undefined ? undefined : String(row.barberId),
        orderId: row.orderId === undefined ? undefined : String(row.orderId),
        productId: row.productId === undefined ? undefined : String(row.productId),
      }));
    },

    getGallery: async (): Promise<AdminGalleryImage[]> => {
      const rows = await request<Array<{ id: number; url: string; alt: string; uploadedAt: string }>>('/api/gallery', undefined, true);
      return rows.map((r) => ({ ...r, id: String(r.id), uploadedAt: r.uploadedAt?.slice(0, 10) ?? '' }));
    },
    deleteGalleryImage: async (id: string) => request(`/api/gallery/${id}`, { method: 'DELETE' }, true),
    getGalleryFiltered: async ({
      page = 0,
      size = 100,
      sort = ['uploadedAt,desc'],
      ...filters
    }: GalleryFilters = {}): Promise<PaginatedResult<AdminGalleryImage>> => {
      const query = buildQueryString({ page, size, sort, ...filters });
      const rows = await request<PageResponse<AdminGalleryRow>>(`/api/gallery/page${query}`, undefined, true);
      return mapPaginatedResponse(rows, (r) => ({
        ...r,
        id: String(r.id),
        uploadedAt: r.uploadedAt?.slice(0, 10) ?? '',
      }));
    },

    getUsers: async (): Promise<AdminUser[]> => {
      const rows = await request<Array<{ id: number; name: string; email: string; phone: string; role: 'user' | 'admin'; createdAt: string; deleted: boolean; deletedAt: string }>>('/api/users', undefined, true);
      return rows.map((r) => ({ ...r, id: String(r.id), role: (r.role ?? 'user') as 'user' | 'admin' }));
    },
    updateUser: async (id: string, payload: { name: string; phone: string }) => request(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, true),
    updateUserRole: async (id: string, role: 'user' | 'admin') => request(`/api/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }, true),
    deleteUser: async (id: string) => request(`/api/users/${id}`, { method: 'DELETE' }, true),
    getUsersFiltered: async ({
      page = 0,
      size = 100,
      sort = ['createdAt,desc', 'id,desc'],
      role,
      ...filters
    }: AdminUsersFilters = {}): Promise<PaginatedResult<AdminUser>> => {
      const query = buildQueryString({
        page,
        size,
        sort,
        role: role === 'all' ? undefined : role,
        ...filters,
      });
      const rows = await request<PageResponse<AdminUserRow>>(`/api/users/page${query}`, undefined, true);
      return mapPaginatedResponse(rows, (r) => ({
        ...r,
        id: String(r.id),
        role: (r.role ?? 'user') as 'user' | 'admin',
      }));
    },

    getDashboardStats: async (): Promise<{
      stats: {
        totalBookings: number;
        bookingGrowth: number;
        totalRevenue: number;
        revenueGrowth: number;
        totalUsers: number;
        userGrowth: number;
        totalOrders: number;
        orderGrowth: number;
      };
      revenueData: Array<{ month: string; revenue: number; bookings: number }>;
      recentBookings: Array<{
        id: string;
        userName: string;
        serviceName: string;
        barberName: string;
        date: string;
        time: string;
        status: string;
        price: number;
      }>;
    }> => request('/api/admin/dashboard', undefined, true),
  },
};
