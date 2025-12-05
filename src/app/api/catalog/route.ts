export const dynamic = 'force-dynamic';
export const revalidate = 300;

import { NextRequest } from 'next/server';
import { ProductsQuerySchema } from '@/lib/validators/query-params';
import { badRequest, serverError, ok } from '@/lib/http/response';
import { cloudCartProducts } from '@/lib/services/cloudcart';
import { firestoreProducts } from '@/lib/services/firestore';
import type { ApiRouteResponse } from '@/lib/types/api';
import type { ProductsResponse } from '@/lib/types/products';

export async function GET(request: NextRequest): ApiRouteResponse<ProductsResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q');
    const pageParam = searchParams.get('page') || '1';
    const perPageParam = searchParams.get('per_page') || '20';
    const source = searchParams.get('source') || 'cloudcart';

    // Validate query parameters
    const queryValidation = ProductsQuerySchema.safeParse({
      page: pageParam,
      per_page: perPageParam,
      q: query,
    });

    if (!queryValidation.success) {
      return badRequest('Invalid query parameters', queryValidation.error.flatten());
    }

    const { page = 1, per_page = 20, q } = queryValidation.data;

    // Select products service based on source
    const productsService = source === 'firestore' ? firestoreProducts : cloudCartProducts;

    // Fetch products using service layer
    const productsResponse = await productsService.getAll({
      page,
      perPage: per_page,
      query: q || undefined,
    });

    return ok(productsResponse);
  } catch (error) {
    console.error('Error fetching products:', error);
    return serverError('Internal server error');
  }
}
