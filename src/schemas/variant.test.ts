import { describe, it, expect } from 'vitest';
import { VariantSchema } from './variant';

describe('Variant schema', () => {
  it('parses a variant', () => {
    const sample = {
      id: 'v1',
      type: 'variants',
      attributes: {
        item_id: 1,
        v1: null,
        v2: null,
        v3: null,
        v1_id: null,
        v2_id: null,
        v3_id: null,
        quantity: 5,
        sku: 'SKU-1',
        barcode: '123',
        price: 100,
        delivery_price: null,
        weight: null,
        unit_id: null,
        unit_value: null,
        unit_text: null,
        minimum: 1,
        base_unit_value: 1,
        base_unit_id: null,
        unit_type: 'pcs',
        unit_name: null,
        unit_short_name: null,
        unit_value_formatted: null,
      },
    };
    const parsed = VariantSchema.safeParse(sample);
    expect(parsed.success).toBe(true);
  });
});



