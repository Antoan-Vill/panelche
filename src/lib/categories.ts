import { env } from '@/lib/env';
import type { Category } from '@/lib/types/categories';
import { REVALIDATE } from '@/lib/cache';

// Re-export the Category type for convenience
export type { Category };

export async function getCategories(): Promise<Category[]> {
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/categories`, {
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
