import { describe, it, expect } from 'vitest';
import { normalizeItems, computeTotalsCents } from './validation';

describe('cart-to-order mapping', () => {
  it('maps items and totals correctly', () => {
    const items = normalizeItems([
      { productId: 'a', productName: 'A', unitPrice: 12.34, quantity: 3 },
      { productId: 'b', productName: 'B', unitPrice: 0, quantity: 1 },
    ] as any);
    expect(items[0].unitPriceCents).toBe(1234);
    expect(items[0].totalPriceCents).toBe(3702);
    const totals = computeTotalsCents(items);
    expect(totals.subtotalCents).toBe(3702);
    expect(totals.total).toBeCloseTo(37.02, 2);
  });
});


