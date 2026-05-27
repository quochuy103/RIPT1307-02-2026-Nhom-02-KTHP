import { canCancelBooking, getAvailableTimeSlots, isPastBookingDate, toApiTime } from '@/lib/booking-policy';

describe('booking-policy', () => {
  it('keeps today selectable while blocking previous days', () => {
    const now = new Date(2026, 4, 27, 9, 15, 0);

    expect(isPastBookingDate(new Date(2026, 4, 27), now)).toBe(false);
    expect(isPastBookingDate(new Date(2026, 4, 26), now)).toBe(true);
  });

  it('filters same-day booking slots using the 30-minute lead time', () => {
    const now = new Date(2026, 4, 27, 9, 15, 0);
    const slots = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM'];

    expect(getAvailableTimeSlots(new Date(2026, 4, 27), slots, now)).toEqual(['10:00 AM', '10:30 AM']);
    expect(getAvailableTimeSlots(new Date(2026, 4, 28), slots, now)).toEqual(slots);
  });

  it('allows cancellation only for pending or confirmed bookings outside the 30-minute window', () => {
    const now = new Date(2026, 4, 27, 9, 15, 0);

    expect(canCancelBooking({ date: '2026-05-27', time: '10:00:00', status: 'pending' }, now)).toBe(true);
    expect(canCancelBooking({ date: '2026-05-27', time: '09:30:00', status: 'confirmed' }, now)).toBe(false);
    expect(canCancelBooking({ date: '2026-05-27', time: '11:00:00', status: 'done' }, now)).toBe(false);
  });

  it('normalizes UI time labels to backend time format', () => {
    expect(toApiTime('9:00 AM')).toBe('09:00:00');
    expect(toApiTime('13:30')).toBe('13:30:00');
  });
});
