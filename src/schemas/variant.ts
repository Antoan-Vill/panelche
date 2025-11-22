// src/schemas/variant.ts
import { z } from 'zod';

export const VariantSchema = z.object({
  id: z.string(),
  type: z.string(),
  attributes: z.object({
    item_id: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) || 0 : val),
    v1: z.string().nullable(),
    v2: z.string().nullable(),
    v3: z.string().nullable(),
    v1_id: z.union([z.number(), z.string()]).nullable().transform(val => val === null ? null : (typeof val === 'string' ? parseInt(val) || null : val)),
    v2_id: z.union([z.number(), z.string()]).nullable().transform(val => val === null ? null : (typeof val === 'string' ? parseInt(val) || null : val)),
    v3_id: z.union([z.number(), z.string()]).nullable().transform(val => val === null ? null : (typeof val === 'string' ? parseInt(val) || null : val)),
    quantity: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) || 0 : val),
    sku: z.string().nullish().transform((v) => v ?? ''),
    barcode: z.string().nullish().transform((v) => v ?? ''),
    price: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) || 0 : val),
    delivery_price: z.union([z.number(), z.string()]).nullable().transform(val => val === null ? null : (typeof val === 'string' ? parseFloat(val) || null : val)),
    weight: z.union([z.number(), z.string()]).nullable().transform(val => val === null ? null : (typeof val === 'string' ? parseFloat(val) || null : val)),
    unit_id: z.union([z.number(), z.string()]).nullable().transform(val => val === null ? null : (typeof val === 'string' ? parseInt(val) || null : val)),
    unit_value: z.union([z.number(), z.string()]).nullable().transform(val => val === null ? null : (typeof val === 'string' ? parseFloat(val) || null : val)),
    unit_text: z.string().nullable(),
    minimum: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) || 0 : val),
    base_unit_value: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) || 0 : val),
    base_unit_id: z.union([z.number(), z.string()]).nullable().transform(val => val === null ? null : (typeof val === 'string' ? parseInt(val) || null : val)),
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


