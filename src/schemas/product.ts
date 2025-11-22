import { z } from 'zod';
import { VariantSchema } from './variant';

export const ImageDataSchema = z.object({
  id: z.string(),
  type: z.string(),
  attributes: z.object({
    name: z.string(),
    image_id: z.string(),
    parent_id: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) || 0 : val),
    sort_order: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) || 0 : val),
    last_edited: z.string(),
    date_added: z.string(),
    active: z.string(),
    max_thumb_size: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) || 0 : val),
    background: z.string().nullable().optional(),
    width: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) || 0 : val),
    height: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) || 0 : val),
    gallery_id: z.string().nullable().optional(),
    video_url: z.string().nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
    image_processed: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) || 0 : val),
    src: z.string(),
    thumbs: z.object({
      '150x150': z.string(),
      '300x300': z.string(),
      '600x600': z.string(),
      '800x800': z.string(),
      '1280x1280': z.string(),
      '1920x1920': z.string(),
      original: z.string(),
    }),
  }),
});

export const ProductSchema = z.object({
  id: z.string(),
  type: z.string(),
  attributes: z.object({
    name: z.string(),
    description: z.string().nullable().optional(),
    price: z.union([z.number(), z.string()]).nullable().optional().transform(val => val === null ? null : (typeof val === 'string' ? parseFloat(val) || 0 : val)),
    price_from: z.union([z.number(), z.string()]).nullable().optional().transform(val => val === null ? null : (typeof val === 'string' ? parseFloat(val) || 0 : val)),
    price_to: z.union([z.number(), z.string()]).nullable().optional().transform(val => val === null ? null : (typeof val === 'string' ? parseFloat(val) || 0 : val)),
    image_url: z.string().optional(),
    thumbnail_url: z.string().optional(),
    url_handle: z.string().optional(),
    sku: z.string().optional(),
    stock_quantity: z.union([z.number(), z.string()]).optional().transform(val => typeof val === 'string' ? parseInt(val) || 0 : val),
    is_in_stock: z.union([z.boolean(), z.string()]).optional().transform(val => {
      if (typeof val === 'string') return val === '1' || val.toLowerCase() === 'true';
      return val;
    }),
    categories: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          url_handle: z.string().optional(),
        })
      )
      .optional(),
  }).passthrough(),
  relationships: z
    .object({
      image: z
        .object({
          data: z.object({ type: z.string(), id: z.string() }),
        })
        .optional(),
      category: z
        .object({
          data: z.object({ type: z.string(), id: z.string() }),
        })
        .optional(),
      vendor: z
        .object({
          data: z.object({ type: z.string(), id: z.string() }),
        })
        .optional(),
    })
    .passthrough()
    .optional(),
  variants: z.array(VariantSchema).optional(),
  image: ImageDataSchema.optional(),
}).passthrough();

export const ProductsResponseSchema = z.any();
export const ProductsResponseSchema2 = z
  .object({
    data: z.array(ProductSchema),
    meta: z
      .object({
        page: z.object({
          'current-page': z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) || 1 : val),
          'per-page': z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) || 20 : val),
          from: z.union([z.number(), z.string()]).nullable().transform(val => val === null ? null : (typeof val === 'string' ? parseInt(val) || null : val)),
          to: z.union([z.number(), z.string()]).nullable().transform(val => val === null ? null : (typeof val === 'string' ? parseInt(val) || null : val)),
          total: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) || 0 : val),
          'last-page': z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) || 1 : val),
        }),
      })
      .passthrough(),
    links: z
      .object({
        first: z.string().optional(),
        next: z.string().optional(),
        prev: z.string().optional(),
        last: z.string().optional(),
      })
      .optional(),
  })
  .passthrough();

export type Product = z.infer<typeof ProductSchema>;
export type ProductsResponse = z.infer<typeof ProductsResponseSchema>;
export type ImageData = z.infer<typeof ImageDataSchema>;


