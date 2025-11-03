export interface Category {
  id: string;
  type: string;
  attributes: {
    name: string;
    description?: string;
    url_handle?: string;
    image_url?: string;
    order?: number;
    parent_id?: number | null;
  };
}

import { env } from '@/lib/env';
import { REVALIDATE } from '@/lib/cache';

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
    return Array.isArray(responseData.data) ? responseData.data : [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}
