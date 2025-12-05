const fs = require('fs');
const { z } = require('zod');

// Load the actual response
const response = JSON.parse(fs.readFileSync('./productsResponse.json', 'utf8'));

// Define the schemas (simplified version to debug)
const ImageDataSchema = z.object({
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

const VariantSchema = z.object({
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

const ProductSchema = z.object({
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

const ProductsResponseSchema2 = z
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

console.log('Testing schema validation...');

try {
  const parsed = ProductsResponseSchema2.safeParse(response);
  if (parsed.success) {
    console.log('✅ Schema validation passed!');
  } else {
    console.log('❌ Schema validation failed:');
    console.log(JSON.stringify(parsed.error.issues, null, 2));
  }
} catch (error) {
  console.error('Error during validation:', error);
}


