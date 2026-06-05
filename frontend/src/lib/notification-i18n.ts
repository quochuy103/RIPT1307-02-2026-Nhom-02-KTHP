import { TFunction } from 'i18next';
import { getServiceI18nMeta } from './service-i18n';
import { formatVND } from './format';
import { NotificationItem } from './api';

export const getLocalizedNotification = (notification: NotificationItem, t: TFunction): string => {
  const { type, message } = notification;

  if (type === 'BOOKING_CREATED') {
    // Regex: Booking created for <service> with <barber> on <date> at <time>
    const match = message.match(/^Booking created for (.+?) with (.+?) on (.+?) at (.+)$/);
    if (match) {
      const [, serviceName, barberName, date, time] = match;
      const meta = getServiceI18nMeta(serviceName);
      const translatedService = meta ? t(`serviceItems.${meta.nameKey}`) : serviceName;
      return t('notifications.bookingCreated', {
        service: translatedService,
        barber: barberName,
        date,
        time,
      });
    }
  }

  if (type === 'BOOKING_CANCELLED') {
    // Regex: Booking cancelled for <service> with <barber>
    const match = message.match(/^Booking cancelled for (.+?) with (.+)$/);
    if (match) {
      const [, serviceName, barberName] = match;
      const meta = getServiceI18nMeta(serviceName);
      const translatedService = meta ? t(`serviceItems.${meta.nameKey}`) : serviceName;
      return t('notifications.bookingCancelled', {
        service: translatedService,
        barber: barberName,
      });
    }
  }

  if (type === 'BOOKING_STATUS_UPDATED') {
    // Regex: Booking status updated to: <status>
    const match = message.match(/^Booking status updated to:\s*(.+)$/i);
    if (match) {
      const [, status] = match;
      const statusKey = status.toLowerCase();
      const translatedStatus = t(`myBookings.status.${statusKey}`, { defaultValue: status });
      return t('notifications.bookingStatusUpdated', {
        status: translatedStatus,
      });
    }
  }

  if (type === 'ORDER_PLACED') {
    // Regex: Order placed for $<total>
    const match = message.match(/^Order placed for \$?([\d.,]+)$/);
    if (match) {
      const [, amountStr] = match;
      const amount = parseFloat(amountStr.replace(/,/g, ''));
      const formattedTotal = isNaN(amount) ? amountStr : formatVND(amount);
      return t('notifications.orderPlaced', {
        total: formattedTotal,
      });
    }
  }

  if (type === 'ORDER_STATUS_UPDATED') {
    // Can be: "Order status updated to: <status>"
    const statusMatch = message.match(/^Order status updated to:\s*(.+)$/i);
    if (statusMatch) {
      const [, status] = statusMatch;
      const statusKey = status.toLowerCase();
      const translatedStatus = t(`myOrders.status.${statusKey}`, { defaultValue: status });
      return t('notifications.orderStatusUpdated', {
        status: translatedStatus,
      });
    }

    // Can be: "Order marked as received."
    if (message.includes('received')) {
      return t('notifications.orderReceived');
    }

    // Can be: "Order cancelled. Stock restored."
    if (message.includes('cancelled')) {
      return t('notifications.orderCancelled');
    }
  }

  // Fallback to original message if translation regex doesn't match
  return message;
};
