// Re-export new service layer for server-side usage
export {
  getCloudCartClient,
  CloudCartClient,
  cloudCartImages,
  CloudCartImagesService,
  cloudCartCategories,
  CloudCartCategoriesService,
  cloudCartProducts,
  CloudCartProductsService,
  cloudCartVariants,
  CloudCartVariantsService,
} from '@/lib/services/cloudcart/index';

// Client-side functions (for use in client components that call internal API routes)
import { env } from '@/lib/env';
import { fetchJson } from '@/lib/http/fetcher';
import { REVALIDATE } from '@/lib/cache';
import type { ProductsResponse, Variant, ImageData, Product } from '@/lib/types/products';
import type { Category } from '@/lib/types/categories';
import type { VariantStockUpdateResponse } from '@/lib/types/api';

export async function getProductsByCategory(categorySlug: string, page: number = 1) {
  const isServer = typeof window === 'undefined';
  
  if (isServer) {
    // Server-side: use the service layer directly
    const { cloudCartProducts } = await import('@/lib/services/cloudcart/index');
    return cloudCartProducts.getByCategory(categorySlug, page);
  } else {
    // Client-side: make HTTP request using relative URL
    const url = `/api/categories/${categorySlug}/products?page=${page}`;
    return fetchJson<ProductsResponse>(url, { next: { revalidate: REVALIDATE.products } });
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const isServer = typeof window === 'undefined';
  
  if (isServer) {
    // Server-side: use the service layer directly
    const { cloudCartCategories } = await import('@/lib/services/cloudcart/index');
    return cloudCartCategories.getBySlug(slug);
  } else {
    // Client-side: make HTTP request using relative URL
    const url = `/api/categories/${slug}`;
    return fetchJson<Category>(url, { next: { revalidate: REVALIDATE.categories } });
  }
}

export async function getImageDetails(imageId: string): Promise<ImageData | null> {
  if (!env.SITE_URL || !env.CLOUDCART_API_KEY) {
    return null;
  }

  const res = await fetch(`${env.SITE_URL}/api/v2/images/${imageId}`, {
    headers: {
      'X-CloudCart-ApiKey': env.CLOUDCART_API_KEY,
      'Content-Type': 'application/json',
    },
    next: { revalidate: REVALIDATE.products },
  });

  if (!res.ok) {
    return null;
  }

  interface CloudCartImageResponse {
    data: ImageData;
  }

  const data = await res.json() as CloudCartImageResponse;
  return data.data;
}

export async function updateVariantStock(
  variantId: string, 
  quantity: number
): Promise<VariantStockUpdateResponse> {
  if (!env.SITE_URL || !env.CLOUDCART_API_KEY) {
    const error = new Error('Missing environment variables for API call') as Error & { status?: number };
    error.status = 500;
    throw error;
  }

  const res = await fetch(`${env.SITE_URL}/api/v2/variants/${variantId}`, {
    method: 'PATCH',
    headers: {
      'X-CloudCart-ApiKey': env.CLOUDCART_API_KEY,
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json',
    },
    body: JSON.stringify({
      data: {
        type: 'variants',
        id: variantId,
        attributes: { quantity },
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const error = new Error(text || 'Failed to update variant stock') as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  return res.json() as Promise<VariantStockUpdateResponse>;
}
