export const revalidate = 300;

import { z } from 'zod';
import { badRequest, notFound, serverError, ok } from '@/lib/http/response';
import { cloudCartCategories } from '@/lib/services/cloudcart';
import type { ApiRouteResponse } from '@/lib/types/api';
import type { Category } from '@/lib/types/categories';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
): ApiRouteResponse<Category> {
  try {
    const { slug } = await params;
    const ParamsSchema = z.object({ slug: z.string().min(1) });
    const parsedParams = ParamsSchema.safeParse({ slug });
    if (!parsedParams.success) {
      return badRequest('Invalid parameters', parsedParams.error.flatten());
    }

    // Fetch category by slug using service layer
    const category = await cloudCartCategories.getBySlug(slug);

    if (!category) {
      return notFound('Category not found');
    }

    return ok(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return serverError('Internal server error');
  }
}
