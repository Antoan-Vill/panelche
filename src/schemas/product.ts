import { z } from 'zod';
import { VariantSchema } from './variant';

export const ImageDataSchema = z.object({
  id: z.string(),
  type: z.string(),
  attributes: z.object({
    name: z.string(),
    image_id: z.string(),
    parent_id: z.number(),
    sort_order: z.number(),
    last_edited: z.string(),
    date_added: z.string(),
    active: z.string(),
    max_thumb_size: z.number(),
    background: z.string().nullable().optional(),
    width: z.number(),
    height: z.number(),
    gallery_id: z.string().nullable().optional(),
    video_url: z.string().nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
    image_processed: z.number(),
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
    price: z.number().optional(),
    price_from: z.number().optional(),
    price_to: z.number().optional(),
    image_url: z.string().optional(),
    thumbnail_url: z.string().optional(),
    url_handle: z.string().optional(),
    sku: z.string().optional(),
    stock_quantity: z.number().optional(),
    is_in_stock: z.boolean().optional(),
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
          'current-page': z.number(),
          'per-page': z.number(),
          from: z.number(),
          to: z.number(),
          total: z.number(),
          'last-page': z.number(),
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


