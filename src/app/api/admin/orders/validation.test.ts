import { describe, it, expect } from 'vitest';
import { PayloadSchema, normalizeItems, computeTotalsCents } from './validation';

describe('orders validation', () => {
  it('validates payload and computes totals', () => {
    const raw = {
      owner: { kind: 'guest', email: 'guest@example.com' },
      items: [
        { productId: 'p1', productName: 'P1', unitPrice: 9.99, quantity: 2 },
        { productId: 'p2', productName: 'P2', unitPrice: 5, quantity: 1 },
      ],
    };
    const parsed = PayloadSchema.parse(raw);
    const items = normalizeItems(parsed.items as any);
    const totals = computeTotalsCents(items);
    expect(totals.subtotalCents).toBe(9.99 * 2 * 100 + 5 * 100);
    expect(totals.totalCents).toBe(totals.subtotalCents);
  });

  it('rejects invalid payloads', () => {
    const bad = {
      owner: { kind: 'guest', email: 'not-an-email' },
      items: [],
    };
    const result = PayloadSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });
});


