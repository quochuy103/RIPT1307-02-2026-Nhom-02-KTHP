export const orderStatuses = ['pending', 'paid', 'shipping', 'shipped', 'delivered', 'cancelled'] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export type OrderStatusUpdate = Exclude<OrderStatus, 'cancelled'>;
