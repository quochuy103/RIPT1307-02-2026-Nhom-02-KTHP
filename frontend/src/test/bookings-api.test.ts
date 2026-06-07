import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';

describe('booking API routes', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('loads admin bookings from the /api namespace', async () => {
    localStorage.setItem('cutie_cuts_token', 'test-token');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [
            {
              id: 1,
              userId: 2,
              userName: 'Admin User',
              serviceId: 3,
              serviceName: 'Haircut',
              barberId: 4,
              barberName: 'Barber A',
              date: '2026-06-07',
              time: '09:30:00',
              status: 'pending',
              price: 150000,
            },
          ],
          totalPages: 1,
          totalElements: 1,
          number: 0,
          size: 100,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    const result = await api.admin.getBookingsFiltered();

    expect(result.content[0]).toMatchObject({
      id: '1',
      userId: '2',
      serviceId: '3',
      barberId: '4',
      serviceName: 'Haircut',
    });
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain('/api/bookings/page?page=0&size=100&sort=date%2Cdesc&sort=time%2Cdesc');
  });
});
