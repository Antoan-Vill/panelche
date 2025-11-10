export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { badRequest, serverError, ok } from '@/lib/http/response';
import { CategoriesQuerySchema } from '@/lib/validators/query-params';
import { cloudCartCategories } from '@/lib/services/cloudcart';

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

    // Fetch categories from CloudCart using service layer
    const categories = await cloudCartCategories.getAll({
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
