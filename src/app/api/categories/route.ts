export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { env } from '@/lib/env';
import { CategorySchema } from '@/schemas/category';
import { badRequest, notFound, serverError, ok } from '@/lib/http/response';
import { REVALIDATE } from '@/lib/cache';

// Response schema for the categories API
const CategoriesResponseSchema = z.object({
  data: z.array(CategorySchema),
});

// Query parameters schema
const CategoriesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
  include: z.string().nullable().optional(), // e.g., "images,products"
});

async function fetchCategoriesFromCloudCart(limit: number, offset: number, include?: string) {
  if (!env.CLOUDCART_API_KEY || !env.SITE_URL) {
    throw new Error('Missing required CloudCart configuration');
  }

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (include) {
    params.append('include', include);
  }

  const cloudCartUrl = `${env.SITE_URL}/api/v2/categories?${params.toString()}`;

  const response = await fetch(cloudCartUrl, {
    headers: {
      'X-CloudCart-ApiKey': env.CLOUDCART_API_KEY,
      'Content-Type': 'application/json',
    },
    next: { revalidate: REVALIDATE.categories },
  });

  return response;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters with proper defaults
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const includeParam = searchParams.get('include');

    // Validate query parameters
    const queryValidation = CategoriesQuerySchema.safeParse({
      limit: limitParam ? parseInt(limitParam, 10) : undefined,
      offset: offsetParam ? parseInt(offsetParam, 10) : undefined,
      include: includeParam,
    });

    if (!queryValidation.success) {
      return badRequest('Invalid query parameters', queryValidation.error.flatten());
    }

    const { limit = 50, offset = 0, include } = queryValidation.data;

    // Fetch categories from CloudCart
    const response = await fetchCategoriesFromCloudCart(limit, offset, include ?? undefined);

    if (!response.ok) {
      const errorText = await response.text();

      if (response.status === 404) {
        return notFound('Categories not found');
      }

      if (response.status === 401 || response.status === 403) {
        return serverError('Authentication failed with CloudCart API');
      }

      return serverError('Failed to fetch categories from external API');
    }

    const cloudCartResponse = await response.json();

    // Validate the response structure
    const validation = CategoriesResponseSchema.safeParse(cloudCartResponse);
    if (!validation.success) {
      return serverError('Invalid response format from external API', validation.error?.flatten());
    }

    const { data: categoriesData } = validation;

    if (!categoriesData) {
      return serverError('Invalid response format from external API');
    }

    // If include=images is requested, fetch images for categories that have image_id
    let categoriesWithImages = categoriesData!.data;

    if (include?.includes('images')) {
      categoriesWithImages = await Promise.all(
        categoriesData!.data.map(async (category) => {
          const categoryWithImage = { ...category };

          if (category.attributes.image_id) {
            try {
              if (!env.CLOUDCART_API_KEY || !env.SITE_URL) {
                throw new Error('Missing required CloudCart configuration');
              }

              const imageResponse = await fetch(
                `${env.SITE_URL}/api/v2/images/${category.attributes.image_id}`,
                {
                  headers: {
                    'X-CloudCart-ApiKey': env.CLOUDCART_API_KEY,
                    'Content-Type': 'application/json',
                  },
                  next: { revalidate: REVALIDATE.categories },
                }
              );

              if (imageResponse.ok) {
                const imageData = await imageResponse.json();
                categoryWithImage.attributes.image_url =
                  imageData.data?.attributes?.thumbs?.original ||
                  imageData.data?.attributes?.src;
              }
            } catch (error) {
              // Silently fail for images - categories still load without images
            }
          }

          return categoryWithImage;
        })
      );
    }

    return ok(categoriesWithImages);
  } catch (error) {
    console.error('Error in categories API route:', error);
    return serverError('Internal server error');
  }
}
