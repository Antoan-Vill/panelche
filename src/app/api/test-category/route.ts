import { ok } from '@/lib/http/response';
import { cloudCartCategories } from '@/lib/services/cloudcart';

export async function GET() {
  try {
    const category = await cloudCartCategories.getBySlug('damski-vrahni-drehi');
    return ok({
      found: !!category,
      category: category ? {
        id: category.id,
        type: typeof category.id,
        name: category.attributes.name,
        url_handle: category.attributes.url_handle
      } : null
    });
  } catch (error) {
    console.error('Category test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return ok({ error: errorMessage });
  }
}


