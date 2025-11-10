import { env } from '@/lib/env';
import type { Category } from '@/lib/types/categories';
import { cloudCartCategories } from '@/lib/services/cloudcart';

// Re-export the Category type for convenience
export type { Category };

export async function getCategories(): Promise<Category[]> {
  try {
    // On the server, directly call the service layer instead of making HTTP requests
    // This avoids issues with VERCEL_URL and self-referencing HTTP calls
    const isServer = typeof window === 'undefined';
    
    if (isServer) {
      // Server-side: use the service layer directly
      const categories = await cloudCartCategories.getAll();
      return categories;
    } else {
      // Client-side: make HTTP request using NEXT_PUBLIC_APP_URL
      const baseUrl = env.NEXT_PUBLIC_APP_URL;
      const response = await fetch(`${baseUrl}/api/categories`);

      if (!response.ok) {
        console.error('Failed to fetch categories:', response.status);
        return [];
      }

      const responseData = await response.json();
      return Array.isArray(responseData.data) ? responseData.data : [];
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}
