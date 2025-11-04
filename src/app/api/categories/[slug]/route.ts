export const revalidate = 300;

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CategorySchema } from '@/schemas/category';
import { badRequest, notFound, serverError } from '@/lib/http/response';
import { REVALIDATE } from '@/lib/cache';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const ParamsSchema = z.object({ slug: z.string().min(1) });
    const parsedParams = ParamsSchema.safeParse({ slug });
    if (!parsedParams.success) {
      return badRequest('Invalid parameters', parsedParams.error.flatten());
    }
    const siteUrl = process.env.SITE_URL;
    const apiKey = process.env.CLOUDCART_API_KEY;

    if (!siteUrl) {
      return serverError('SITE_URL environment variable not set');
    }

    if (!apiKey) {
      return serverError('CloudCart API key not set');
    }

    // Fetch all categories to find the one with matching slug
    const response = await fetch(`${siteUrl}/api/v2/categories`, {
      headers: {
        'X-CloudCart-ApiKey': apiKey,
        'Content-Type': 'application/json',
      },
      // cache: 'no-store',
      next: { revalidate: REVALIDATE.categories },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch categories for slug lookup:', response.status, errorText);
      return serverError('Failed to fetch categories from CloudCart API');
    }

    const data = await response.json();
    const categories = data.data || [];
    const category = categories.find((cat: any) => cat.attributes.url_handle === slug);

    if (!category) {
      return notFound('Category not found');
    }

    // Fetch image for category if it has image_id
    if (category.attributes.image_id) {
      try {
        const imageResponse = await fetch(`${siteUrl}/api/v2/images/${category.attributes.image_id}`, {
          headers: {
            'X-CloudCart-ApiKey': apiKey,
            'Content-Type': 'application/json',
          },
          next: { revalidate: REVALIDATE.categories },
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          // Add image URL to category attributes
          category.attributes.image_url = imageData.data?.attributes?.thumbs?.original || imageData.data?.attributes?.src;
        }
      } catch (error) {
        console.warn(`Failed to fetch image for category ${category.id}:`, error);
      }
    }

    const parsed = CategorySchema.safeParse(category);
    if (!parsed.success) {
      return serverError('Invalid category payload', parsed.error.flatten());
    }
    return NextResponse.json(parsed.data);
  } catch (error) {
    console.error('Error fetching category:', error);
    return serverError('Internal server error');
  }
}

