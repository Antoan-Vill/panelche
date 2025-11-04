import type { Variant } from '@/lib/types/products';

export {
  getProductsByCategory,
  getCategoryBySlug,
  getProductVariants,
  getImageDetails,
  getProductById,
} from '@/lib/services/cloudcart';

// Client-safe helper: fetch variants via our Next.js API route
export async function getProductVariantsClient(productId: string): Promise<Variant[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const url = baseUrl
      ? `${baseUrl}/api/products/${productId}/variants`
      : `/api/products/${productId}/variants`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return [];
    }
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.error('Error fetching variants via API route:', err);
    return [];
  }
}

