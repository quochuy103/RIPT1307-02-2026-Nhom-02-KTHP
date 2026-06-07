import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';

describe('api.orders.getMyOrdersPaged', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('normalizes product quantity from the user order history endpoint', async () => {
    localStorage.setItem('cutie_cuts_token', 'test-token');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [
            {
              id: 1,
              totalPrice: 150000,
              address: 'Test address',
              status: 'pending',
              createdAt: '2026-06-07T09:30:00',
              products: [
                {
                  productId: 99,
                  name: 'Premium Hair Wax',
                  quantity: 1,
                  price: 150000,
                },
              ],
            },
          ],
          totalPages: 1,
          totalElements: 1,
          number: 0,
          size: 10,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    const result = await api.orders.getMyOrdersPaged(0, 10);

    expect(result.content[0]?.products[0]).toMatchObject({
      productId: '99',
      name: 'Premium Hair Wax',
      qty: 1,
      price: 150000,
    });
    expect(result.content[0]?.totalPrice).toBe(150000);
    expect(fetchSpy).toHaveBeenCalledOnce();
  });
});
