export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { badRequest, serverError, ok } from '@/lib/http/response';
import { CategoriesQuerySchema } from '@/lib/validators/query-params';
import { cloudCartCategories } from '@/lib/services/cloudcart';
import { firestoreCategories } from '@/lib/services/firestore';
import type { ApiRouteResponse } from '@/lib/types/api';
import type { Category } from '@/lib/types/categories';

export async function GET(request: Request): ApiRouteResponse<Category[]> {
  try {
    const { searchParams } = new URL(request.url);

    // Get data source preference
    const source = searchParams.get('source') || 'cloudcart';

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

    // Select service based on data source
    const categoriesService = source === 'firestore' ? firestoreCategories : cloudCartCategories;

    // Fetch categories using the selected service
    const categories = await categoriesService.getAll({
      limit,
      offset,
      include: include ?? undefined,
    });

    return ok(categories);
  } catch (error) {
    console.error('Error in categories API route:', error);
    return serverError('Internal server error');
  }
}
