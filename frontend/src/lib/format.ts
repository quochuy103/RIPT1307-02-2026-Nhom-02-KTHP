/**
 * Format a number as Vietnamese Dong (VND).
 * Example: 150000 → "150.000 ₫"
 */
export const formatVND = (amount: number): string =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
