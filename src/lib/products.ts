import type { ProductsResponse, Variant, ImageData } from '@/lib/types/products';

export async function getProductsByCategory(
  categorySlug: string,
  page: number = 1
): Promise<ProductsResponse> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(
      `${baseUrl}/api/categories/${categorySlug}/products?page=${page}`,
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch products:', response.status);
      return { data: [], meta: { page: { 'current-page': 1, 'per-page': 100, from: 0, to: 0, total: 0, 'last-page': 1 } } };
    }

    const productsData: ProductsResponse = await response.json();
    return productsData;
  } catch (error) {
    console.error('Error fetching products:', error);
    return { data: [], meta: { page: { 'current-page': 1, 'per-page': 100, from: 0, to: 0, total: 0, 'last-page': 1 } } };
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/categories/${slug}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Failed to fetch category:', response.status);
      return null;
    }

    const category = await response.json();
    return category;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

export async function getProductVariants(productId: string): Promise<Variant[]> {
  try {
    const siteUrl = process.env.SITE_URL;
    const apiKey = process.env.CLOUDCART_API_KEY;

    if (!siteUrl || !apiKey) {
      console.error('Missing environment variables for API call');
      const error = new Error('Missing environment variables for API call') as Error & { status?: number };
      error.status = 500;
      throw error;
    }

    const response = await fetch(`${siteUrl}/api/v2/products/${productId}?include=variants`, {
      headers: {
        'X-CloudCart-ApiKey': apiKey,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const error = new Error('Failed to fetch product variants') as Error & { status?: number };
      error.status = response.status;
      console.error('Failed to fetch product variants:', response.status);
      throw error;
    }

    const data = await response.json();
    return data.included || [];
  } catch (error) {
    console.error('Error fetching product variants:', error);

    if (error instanceof Error) {
      const errWithStatus = error as Error & { status?: number };
      if (typeof errWithStatus.status !== 'number') {
        errWithStatus.status = 500;
      }
      throw errWithStatus;
    }

    const fallbackError = new Error('Unknown error fetching product variants') as Error & { status?: number };
    fallbackError.status = 500;
    throw fallbackError;
  }
}

export async function getImageDetails(imageId: string): Promise<ImageData | null> {
  try {
    const siteUrl = process.env.SITE_URL;
    const apiKey = process.env.CLOUDCART_API_KEY;

    if (!siteUrl || !apiKey) {
      console.error('Missing environment variables for API call');
      return null;
    }

    const response = await fetch(`${siteUrl}/api/v2/images/${imageId}`, {
      headers: {
        'X-CloudCart-ApiKey': apiKey,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Failed to fetch image details:', response.status);
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching image details:', error);
    return null;
  }
}

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

