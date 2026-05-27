import { addMinutes, isBefore, isSameDay, parseISO, startOfDay } from 'date-fns';

export const BOOKING_NOTICE_MINUTES = 30;
export const MAX_BOOKINGS_PER_DATE = 3;
export const MAX_CANCELLATIONS_PER_DATE = 3;

const parseTimeParts = (value: string) => {
  const normalized = value.trim();
  const amPmMatch = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (amPmMatch) {
    const [, hourValue, minuteValue, periodValue] = amPmMatch;
    const period = periodValue.toUpperCase();
    let hour = Number(hourValue);

    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    return { hour, minute: Number(minuteValue), second: 0 };
  }

  const twentyFourHourMatch = normalized.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!twentyFourHourMatch) return null;

  const [, hourValue, minuteValue, secondValue] = twentyFourHourMatch;
  return {
    hour: Number(hourValue),
    minute: Number(minuteValue),
    second: Number(secondValue ?? '0'),
  };
};

const combineDateAndTime = (date: Date, rawTime: string) => {
  const timeParts = parseTimeParts(rawTime);
  if (!timeParts) return null;

  const nextDate = new Date(date);
  nextDate.setHours(timeParts.hour, timeParts.minute, timeParts.second, 0);
  return nextDate;
};

export const toApiTime = (rawTime: string) => {
  const timeParts = parseTimeParts(rawTime);
  if (!timeParts) return rawTime;

  return `${String(timeParts.hour).padStart(2, '0')}:${String(timeParts.minute).padStart(2, '0')}:${String(timeParts.second).padStart(2, '0')}`;
};

export const isPastBookingDate = (date: Date, now = new Date()) =>
  isBefore(startOfDay(date), startOfDay(now));

export const isBookingTimeSelectable = (date: Date, rawTime: string, now = new Date()) => {
  const bookingDateTime = combineDateAndTime(date, rawTime);
  if (!bookingDateTime) return false;

  return !isBefore(bookingDateTime, addMinutes(now, BOOKING_NOTICE_MINUTES));
};

export const getAvailableTimeSlots = (selectedDate: Date | undefined, timeSlots: string[], now = new Date()) => {
  if (!selectedDate) return timeSlots;
  if (isPastBookingDate(selectedDate, now)) return [];
  if (!isSameDay(selectedDate, now)) return timeSlots;

  return timeSlots.filter((slot) => isBookingTimeSelectable(selectedDate, slot, now));
};

export const canCancelBooking = (
  booking: { date: string; time: string; status: string },
  now = new Date(),
) => {
  const normalizedStatus = booking.status.trim().toLowerCase();
  if (normalizedStatus !== 'pending' && normalizedStatus !== 'confirmed') {
    return false;
  }

  const bookingDate = parseISO(booking.date);
  if (Number.isNaN(bookingDate.getTime())) return false;

  return isBookingTimeSelectable(bookingDate, booking.time, now);
};

const normalizeDateKey = (value: string | Date) => {
  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }
  return value;
};

export const countBookingsForDate = (
  bookings: Array<{ date: string; status: string }>,
  appointmentDate: string | Date,
) => {
  const dateKey = normalizeDateKey(appointmentDate);
  return bookings.filter((booking) => booking.date === dateKey).length;
};

export const countCancelledBookingsForDate = (
  bookings: Array<{ date: string; status: string }>,
  appointmentDate: string | Date,
) => {
  const dateKey = normalizeDateKey(appointmentDate);
  return bookings.filter((booking) =>
    booking.date === dateKey && booking.status.trim().toLowerCase() === 'cancelled').length;
};

export const hasReachedBookingLimitForDate = (
  bookings: Array<{ date: string; status: string }>,
  appointmentDate: string | Date,
) => countBookingsForDate(bookings, appointmentDate) >= MAX_BOOKINGS_PER_DATE;

export const hasReachedCancellationLimitForDate = (
  bookings: Array<{ date: string; status: string }>,
  appointmentDate: string | Date,
) => countCancelledBookingsForDate(bookings, appointmentDate) >= MAX_CANCELLATIONS_PER_DATE;
