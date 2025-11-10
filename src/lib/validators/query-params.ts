import { z } from 'zod';

/**
 * Reusable query parameter schemas for API routes
 */

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  per_page: z.coerce.number().int().min(1).max(100).default(20).optional(),
});

export const CategoriesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
  include: z.string().nullable().optional(), // e.g., "images,products"
});

export const ProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  per_page: z.coerce.number().int().min(1).max(100).default(20).optional(),
  q: z.string().optional(), // search query
  category_id: z.string().optional(),
  include: z.string().optional(), // e.g., "images,variants"
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type CategoriesQuery = z.infer<typeof CategoriesQuerySchema>;
export type ProductsQuery = z.infer<typeof ProductsQuerySchema>;

