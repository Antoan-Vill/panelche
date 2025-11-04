// src/schemas/variant.ts
import { z } from 'zod';

export const VariantSchema = z.object({
  id: z.string(),
  type: z.string(),
  attributes: z.object({
    item_id: z.number(),
    v1: z.string().nullable(),
    v2: z.string().nullable(),
    v3: z.string().nullable(),
    v1_id: z.number().nullable(),
    v2_id: z.number().nullable(),
    v3_id: z.number().nullable(),
    quantity: z.number(),
    sku: z.string().nullish().transform((v) => v ?? ''),
    barcode: z.string().nullish().transform((v) => v ?? ''),
    price: z.number(),
    delivery_price: z.number().nullable(),
    weight: z.number().nullable(),
    unit_id: z.number().nullable(),
    unit_value: z.number().nullable(),
    unit_text: z.string().nullable(),
    minimum: z.number(),
    base_unit_value: z.number(),
    base_unit_id: z.number().nullable(),
    unit_type: z.string(),
    unit_name: z.string().nullable(),
    unit_short_name: z.string().nullable(),
    unit_value_formatted: z.string().nullable(),
  }),
});

export type Variant = z.infer<typeof VariantSchema>;

export const VariantStockUpdateSchema = z.object({
  quantity: z.number().int().min(0),
});
export type VariantStockUpdate = z.infer<typeof VariantStockUpdateSchema>;


