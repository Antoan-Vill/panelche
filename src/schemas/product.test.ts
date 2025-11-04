import { describe, it, expect } from 'vitest';
import { ProductSchema, ProductsResponseSchema } from './product';

describe('Product schemas', () => {
  it('parses a minimal product', () => {
    const sample = {
      id: '1',
      type: 'products',
      attributes: {
        name: 'Test',
        price: 100,
      },
    };
    const parsed = ProductSchema.safeParse(sample);
    expect(parsed.success).toBe(true);
  });

  it('parses a products response', () => {
    const sample = {
      data: [
        {
          id: '1',
          type: 'products',
          attributes: {
            name: 'Test',
            price: 100,
          },
        },
      ],
      meta: {
        page: {
          'current-page': 1,
          'per-page': 100,
          from: 1,
          to: 1,
          total: 1,
          'last-page': 1,
        },
      },
    };
    const parsed = ProductsResponseSchema.safeParse(sample);
    expect(parsed.success).toBe(true);
  });
});



