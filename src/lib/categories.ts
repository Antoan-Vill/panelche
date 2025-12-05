import type { Category } from '@/lib/types/categories';

// Re-export the Category type for convenience
export type { Category };

/**
 * Get categories from the API
 * Always uses HTTP API to avoid bundling server-only code in client components
 * 
 * Note: During SSR, returns empty array - client hydration will fetch actual data
 */
export async function getCategories(source: 'cloudcart' | 'firestore' = 'cloudcart'): Promise<Category[]> {
  // During SSR, relative URLs don't work - return empty and let client fetch
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const response = await fetch(`/api/categories?source=${source}`);

    if (!response.ok) {
      console.error('Failed to fetch categories:', response.status);
      return [];
    }

    const responseData = await response.json();
    return Array.isArray(responseData.data) ? responseData.data : [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}
