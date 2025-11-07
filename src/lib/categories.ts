import { env } from '@/lib/env';
import type { Category } from '@/lib/types/categories';
import { REVALIDATE } from '@/lib/cache';

// Re-export the Category type for convenience
export type { Category };

export async function getCategories(): Promise<Category[]> {
  try {
    // Construct the base URL for API calls
    // Priority: VERCEL_URL > NEXT_PUBLIC_APP_URL > localhost fallback
    const isServer = typeof window === 'undefined';
    let baseUrl: string;
    
    if (isServer) {
      // Server-side: use VERCEL_URL if available, otherwise NEXT_PUBLIC_APP_URL
      if (process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
      } else {
        baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      }
    } else {
      // Client-side: use NEXT_PUBLIC_APP_URL
      baseUrl = env.NEXT_PUBLIC_APP_URL;
    }
    
    const response = await fetch(`${baseUrl}/api/categories`, {
      next: { revalidate: REVALIDATE.categories },
    });

    if (!response.ok) {
      console.error('Failed to fetch categories:', response.status);
      return [];
    }

    const responseData = await response.json();
    console.log('responseData', responseData);
    return Array.isArray(responseData.data) ? responseData.data : [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}
