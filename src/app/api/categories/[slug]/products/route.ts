export const dynamic = 'force-dynamic';
export const revalidate = 300;

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { badRequest, notFound, serverError, ok } from '@/lib/http/response';
import { cloudCartProducts } from '@/lib/services/cloudcart';
import { firestoreProducts } from '@/lib/services/firestore';
import type { ApiRouteResponse } from '@/lib/types/api';
import type { ProductsResponse } from '@/lib/types/products';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): ApiRouteResponse<ProductsResponse> {
  try {
    const { slug } = await params;
    const { searchParams } = request.nextUrl;
    const pageParam = searchParams.get('page') || '1';
    const source = searchParams.get('source') || 'cloudcart';

    const ParamsSchema = z.object({ 
      slug: z.string().min(1), 
      page: z.string().regex(/^\d+$/) 
    });
    const parsedParams = ParamsSchema.safeParse({ slug, page: pageParam });
    if (!parsedParams.success) {
      return badRequest('Invalid parameters', parsedParams.error.flatten());
    }

    const page = parseInt(pageParam, 10);

    // Select products service based on source
    const productsService = source === 'firestore' ? firestoreProducts : cloudCartProducts;

    // Fetch products by category slug using service layer
    const productsResponse = await productsService.getByCategory(slug, page);

    return ok(productsResponse);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return notFound('Category not found');
    }
    console.error('Error fetching products:', error);
    return serverError('Internal server error');
  }
}
