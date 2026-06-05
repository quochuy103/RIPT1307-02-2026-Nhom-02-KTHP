import { describe, it, expect, vi } from 'vitest';
import { getLocalizedNotification } from '@/lib/notification-i18n';
import { NotificationItem } from '@/lib/api';

describe('getLocalizedNotification', () => {
  const t = vi.fn((key: string, options?: any) => {
    if (key === 'notifications.bookingCreated') {
      return `Lịch hẹn: ${options.service} với ${options.barber} ngày ${options.date} lúc ${options.time}`;
    }
    if (key === 'notifications.bookingCancelled') {
      return `Hủy lịch: ${options.service} với ${options.barber}`;
    }
    if (key === 'notifications.bookingStatusUpdated') {
      return `Trạng thái lịch: ${options.status}`;
    }
    if (key === 'notifications.orderPlaced') {
      return `Đơn hàng trị giá: ${options.total}`;
    }
    if (key === 'notifications.orderStatusUpdated') {
      return `Trạng thái đơn hàng: ${options.status}`;
    }
    if (key === 'notifications.orderReceived') {
      return 'Đã nhận đơn hàng';
    }
    if (key === 'notifications.orderCancelled') {
      return 'Đã hủy đơn hàng';
    }
    if (key.startsWith('serviceItems.')) {
      const serviceKey = key.split('.')[1];
      if (serviceKey === 'studentHaircut') return 'Cắt Tóc Học Sinh';
      if (serviceKey === 'wowHandsomeCombo') return 'Combo Wow Handsome';
      return serviceKey;
    }
    if (key.startsWith('myBookings.status.')) {
      const statusKey = key.split('.')[2];
      if (statusKey === 'confirmed') return 'Đã xác nhận';
      return statusKey;
    }
    if (key.startsWith('myOrders.status.')) {
      const statusKey = key.split('.')[2];
      if (statusKey === 'shipping') return 'Đang giao';
      return statusKey;
    }
    return key;
  }) as any;

  it('translates BOOKING_CREATED notification', () => {
    const item: NotificationItem = {
      id: 1,
      type: 'BOOKING_CREATED',
      message: 'Booking created for Cắt Tóc Học Sinh with Marcus on 2026-06-05 at 10:30',
      referenceType: 'booking',
      referenceId: 10,
      isRead: false,
      createdAt: '2026-06-05T10:00:00Z',
    };
    const result = getLocalizedNotification(item, t);
    expect(result).toBe('Lịch hẹn: Cắt Tóc Học Sinh với Marcus ngày 2026-06-05 lúc 10:30');
  });

  it('translates BOOKING_CANCELLED notification', () => {
    const item: NotificationItem = {
      id: 2,
      type: 'BOOKING_CANCELLED',
      message: 'Booking cancelled for Cắt Tóc Học Sinh with Marcus',
      referenceType: 'booking',
      referenceId: 10,
      isRead: false,
      createdAt: '2026-06-05T10:00:00Z',
    };
    const result = getLocalizedNotification(item, t);
    expect(result).toBe('Hủy lịch: Cắt Tóc Học Sinh với Marcus');
  });

  it('translates BOOKING_STATUS_UPDATED notification', () => {
    const item: NotificationItem = {
      id: 3,
      type: 'BOOKING_STATUS_UPDATED',
      message: 'Booking status updated to: confirmed',
      referenceType: 'booking',
      referenceId: 10,
      isRead: false,
      createdAt: '2026-06-05T10:00:00Z',
    };
    const result = getLocalizedNotification(item, t);
    expect(result).toBe('Trạng thái lịch: Đã xác nhận');
  });

  it('translates ORDER_PLACED notification', () => {
    const item: NotificationItem = {
      id: 4,
      type: 'ORDER_PLACED',
      message: 'Order placed for $150000.00',
      referenceType: 'order',
      referenceId: 12,
      isRead: false,
      createdAt: '2026-06-05T10:00:00Z',
    };
    const result = getLocalizedNotification(item, t);
    expect(result).toBe('Đơn hàng trị giá: 150.000 ₫'); // Note: non-breaking space inside Intl format
  });

  it('translates ORDER_STATUS_UPDATED shipping notification', () => {
    const item: NotificationItem = {
      id: 5,
      type: 'ORDER_STATUS_UPDATED',
      message: 'Order status updated to: shipping',
      referenceType: 'order',
      referenceId: 12,
      isRead: false,
      createdAt: '2026-06-05T10:00:00Z',
    };
    const result = getLocalizedNotification(item, t);
    expect(result).toBe('Trạng thái đơn hàng: Đang giao');
  });

  it('translates ORDER_STATUS_UPDATED received notification', () => {
    const item: NotificationItem = {
      id: 6,
      type: 'ORDER_STATUS_UPDATED',
      message: 'Order marked as received.',
      referenceType: 'order',
      referenceId: 12,
      isRead: false,
      createdAt: '2026-06-05T10:00:00Z',
    };
    const result = getLocalizedNotification(item, t);
    expect(result).toBe('Đã nhận đơn hàng');
  });

  it('translates ORDER_STATUS_UPDATED cancelled notification', () => {
    const item: NotificationItem = {
      id: 7,
      type: 'ORDER_STATUS_UPDATED',
      message: 'Order cancelled. Stock restored.',
      referenceType: 'order',
      referenceId: 12,
      isRead: false,
      createdAt: '2026-06-05T10:00:00Z',
    };
    const result = getLocalizedNotification(item, t);
    expect(result).toBe('Đã hủy đơn hàng');
  });
});
