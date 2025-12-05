const fs = require('fs');
const { z } = require('zod');

// Test with empty response
const emptyResponse = {
  "meta": {
    "page": {
      "current-page": 1,
      "per-page": 100,
      "from": null,
      "to": null,
      "total": 0,
      "last-page": 1
    }
  },
  "links": {
    "first": "https://ellenmore.com/api/v2/products?filter%5Bcategory_id%5D=123&page%5Bnumber%5D=1&page%5Bsize%5D=100",
    "last": "https://ellenmore.com/api/v2/products?filter%5Bcategory_id%5D=123&page%5Bnumber%5D=1&page%5Bsize%5D=100"
  },
  "data": []
};

// Define the schemas (simplified version to debug)
const ImageDataSchema = z.object({
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

const VariantSchema = z.object({
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

const ProductSchema = z.object({
  id: z.string(),
  type: z.string(),
  attributes: z.object({
    name: z.string(),
    description: z.string().nullable().optional(),
    price: z.union([z.number(), z.string()]).optional().transform(val => typeof val === 'string' ? parseFloat(val) || 0 : val),
    price_from: z.union([z.number(), z.string()]).optional().transform(val => typeof val === 'string' ? parseFloat(val) || 0 : val),
    price_to: z.union([z.number(), z.string()]).optional().transform(val => typeof val === 'string' ? parseFloat(val) || 0 : val),
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

const ProductsResponseSchema2 = z
  .object({
    data: z.array(ProductSchema),
    meta: z
      .object({
        page: z.object({
          'current-page': z.number(),
          'per-page': z.number(),
          from: z.number().nullable(),
          to: z.number().nullable(),
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

console.log('Testing empty response schema validation...');

try {
  const parsed = ProductsResponseSchema2.safeParse(emptyResponse);
  if (parsed.success) {
    console.log('✅ Empty response schema validation passed!');
  } else {
    console.log('❌ Empty response schema validation failed:');
    console.log(JSON.stringify(parsed.error.issues, null, 2));
  }
} catch (error) {
  console.error('Error during validation:', error);
}


