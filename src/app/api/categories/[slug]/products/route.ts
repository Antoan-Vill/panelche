export const dynamic = 'force-dynamic';
export const revalidate = 300;

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { badRequest, notFound, serverError, ok } from '@/lib/http/response';
import { cloudCartProducts } from '@/lib/services/cloudcart';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = request.nextUrl;
    const pageParam = searchParams.get('page') || '1';

    const ParamsSchema = z.object({ 
      slug: z.string().min(1), 
      page: z.string().regex(/^\d+$/) 
    });
    const parsedParams = ParamsSchema.safeParse({ slug, page: pageParam });
    if (!parsedParams.success) {
      return badRequest('Invalid parameters', parsedParams.error.flatten());
    }

    const page = parseInt(pageParam, 10);

    // Fetch products by category slug using service layer
    const productsResponse = await cloudCartProducts.getByCategory(slug, page);

    return ok(productsResponse);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return notFound('Category not found');
    }
    console.error('Error fetching products:', error);
    return serverError('Internal server error');
  }
}
