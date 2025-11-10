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
import type { ProductsResponse, Variant, ImageData } from '@/lib/types/products';

// Helper function to get the base URL for internal API calls
function getBaseUrl(): string {
  const isServer = typeof window === 'undefined';
  
  if (isServer) {
    // Server-side: use VERCEL_URL if available, otherwise NEXT_PUBLIC_APP_URL
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }
  
  // Client-side: use NEXT_PUBLIC_APP_URL
  return env.NEXT_PUBLIC_APP_URL;
}

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

export async function getCategoryBySlug(slug: string) {
  const isServer = typeof window === 'undefined';
  
  if (isServer) {
    // Server-side: use the service layer directly
    const { cloudCartCategories } = await import('@/lib/services/cloudcart/index');
    return cloudCartCategories.getBySlug(slug);
  } else {
    // Client-side: make HTTP request using relative URL
    const url = `/api/categories/${slug}`;
    return fetchJson<any>(url, { next: { revalidate: REVALIDATE.categories } });
  }
}

export async function getProductVariants(productId: string): Promise<Variant[]> {
  if (!env.SITE_URL || !env.CLOUDCART_API_KEY) {
    const error = new Error('Missing environment variables for API call') as Error & { status?: number };
    error.status = 500;
    throw error;
  }

  const res = await fetch(`${env.SITE_URL}/api/v2/products/${productId}?include=variants`, {
    headers: {
      'X-CloudCart-ApiKey': env.CLOUDCART_API_KEY,
      'Content-Type': 'application/json',
    },
    next: { revalidate: REVALIDATE.products },
  });

  if (!res.ok) {
    const error = new Error('Failed to fetch product variants') as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  const data = await res.json();
  return data.included || [];
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

  const data = await res.json();
  return data.data;
}

export async function updateVariantStock(variantId: string, quantity: number) {
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

  return res.json();
}


export async function getProductById(productId: string) {
  if (!env.SITE_URL || !env.CLOUDCART_API_KEY) {
    const error = new Error('Missing environment variables for API call') as Error & { status?: number };
    error.status = 500;
    throw error;
  }

  const res = await fetch(`${env.SITE_URL}/api/v2/products/${productId}?include=images`, {
    headers: {
      'X-CloudCart-ApiKey': env.CLOUDCART_API_KEY,
      'Content-Type': 'application/json',
    },
    next: { revalidate: REVALIDATE.products },
  });

  if (!res.ok) {
    const error = new Error('Failed to fetch product') as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  return res.json();
}
