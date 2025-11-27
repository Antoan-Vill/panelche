import { z } from 'zod';

// Base schema for common attributes
const OrderItemAttributesSchema = z.object({
  item_id: z.number().optional(),
  order_id: z.number().optional(),
  product_id: z.number().optional(),
  variant_id: z.number().nullable().optional(),
  name: z.string().optional(),
  sku: z.string().nullable().optional(),
  quantity: z.number().optional(),
  price: z.number().optional(),
  total: z.number().optional(),
  image_url: z.string().nullable().optional(),
}).passthrough();

export const CloudCartOrderItemSchema = z.object({
  id: z.string(),
  type: z.string(), // 'products' or 'order_items'
  attributes: OrderItemAttributesSchema,
});

const OrderAttributesSchema = z.object({
  // Old fields (kept optional for backward compat if needed)
  order_id: z.number().optional(),
  
  // New fields
  customer_id: z.number().nullable().optional(),
  customer_first_name: z.string().nullable().optional(),
  customer_last_name: z.string().nullable().optional(),
  customer_email: z.string().nullable().optional(),
  
  price_total: z.number().optional(), // New total
  total: z.number().optional(), // Old total
  subtotal: z.number().optional(),
  
  quantity: z.number().optional(),
  invoice_number: z.number().nullable().optional(),
  invoice_date: z.string().nullable().optional(),
  
  date_added: z.string().optional(), // New created date
  created_at: z.string().optional(), // Old created date
  
  currency: z.string().optional(),
  status: z.string(),
  
  updated_at: z.string().optional(),
}).passthrough();

export const CloudCartOrderSchema = z.object({
  id: z.string(),
  type: z.string(), // usually 'orders'
  attributes: OrderAttributesSchema,
  relationships: z.object({
    products: z.object({
      data: z.array(z.object({
        type: z.string(),
        id: z.string(),
      })),
    }).optional(),
    order_items: z.object({
      data: z.array(z.object({
        type: z.string(),
        id: z.string(),
      })),
    }).optional(),
    payment: z.object({ data: z.object({ type: z.string(), id: z.string() }).optional() }).optional(),
    shipping: z.object({ data: z.object({ type: z.string(), id: z.string() }).optional() }).optional(),
  }).passthrough().optional(),
});

export const CloudCartOrdersResponseSchema = z.object({
  data: z.array(CloudCartOrderSchema),
  included: z.array(z.unknown()).optional(),
  meta: z.object({
    page: z.object({
      'current-page': z.number(),
      'per-page': z.number(),
      from: z.number().nullable(),
      to: z.number().nullable(),
      total: z.number(),
      'last-page': z.number(),
    }),
  }).passthrough(),
});

export type CloudCartOrder = z.infer<typeof CloudCartOrderSchema>;
export type CloudCartOrderItem = z.infer<typeof CloudCartOrderItemSchema>;
export type CloudCartOrdersResponse = z.infer<typeof CloudCartOrdersResponseSchema>;
