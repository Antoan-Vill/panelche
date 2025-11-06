export const dynamic = 'force-dynamic';
export const revalidate = 300;

import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { ProductsResponseSchema } from '@/schemas/product';
import { badRequest, notFound, serverError } from '@/lib/http/response';
import { REVALIDATE } from '@/lib/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = request.nextUrl;
    const page = searchParams.get('page') || '1';

    const ParamsSchema = z.object({ slug: z.string().min(1), page: z.string().regex(/^\d+$/) });
    const parsedParams = ParamsSchema.safeParse({ slug, page });
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

    // First get the category ID from the slug
    const categoriesResponse = await fetch(`${siteUrl}/api/v2/categories`, {
      headers: {
        'X-CloudCart-ApiKey': apiKey,
        'Content-Type': 'application/json',
      },
      next: { revalidate: REVALIDATE.categories },
    });

    if (!categoriesResponse.ok) {
      const errorText = await categoriesResponse.text();
      console.error('Failed to fetch categories for slug lookup:', categoriesResponse.status, errorText);
      return serverError('Failed to fetch categories from CloudCart API');
    }

    const categoriesData = await categoriesResponse.json();
    const category = categoriesData.data?.find((cat: any) =>
      cat.attributes.url_handle === slug
    );

    if (!category) {
      return notFound('Category not found');
    }

    // Fetch products for this category
    const productsUrl = new URL(`${siteUrl}/api/v2/products`);
    productsUrl.searchParams.append('filter[category_id]', category.id);
    productsUrl.searchParams.append('include', 'images');
    productsUrl.searchParams.append('page[size]', '100');
    productsUrl.searchParams.append('page[number]', page);
    productsUrl.searchParams.append('sort', 'sort_order');
    productsUrl.searchParams.append('direction', 'asc');

    // console.error('productsUrl', productsUrl.toString());
    const productsResponse = await fetch(productsUrl.toString(), {
      headers: {
        'X-CloudCart-ApiKey': apiKey,
        'Content-Type': 'application/json',
      },
      next: { revalidate: REVALIDATE.products },
    });

    // Read body once then validate
    const productsBody = await productsResponse.json();

    if (!productsResponse.ok) {
      console.error('Failed to fetch products:', productsResponse.status, productsBody);
      return serverError('Failed to fetch products from CloudCart API');
    }

    // console.error('productsBodyyyyy', productsBody);

    const parsed = ProductsResponseSchema.safeParse(productsBody);
    if (!parsed.success) {
      console.error('Invalid products payload received');
      return serverError('Invalid products payload', parsed.error.flatten());
    }
    return NextResponse.json(parsed.data);
  } catch (error) {
    console.error('Error fetching products:', error);
    return serverError('Internal server error');
  }
}

