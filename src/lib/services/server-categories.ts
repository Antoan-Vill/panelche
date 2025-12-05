import 'server-only';
import { cookies } from 'next/headers';
import { firestoreCategories } from '@/lib/services/firestore';
import { cloudCartCategories } from '@/lib/services/cloudcart';
import type { Category } from '@/lib/types/categories';

/**
 * Get categories on the server side
 * Detects data source from cookies or defaults to cloudcart
 */
export async function getCategoriesServer(): Promise<Category[]> {
  try {
    const cookieStore = await cookies();
    const source = cookieStore.get('data-source-preference')?.value as 'cloudcart' | 'firestore' | undefined;
    const selectedSource = source === 'firestore' ? 'firestore' : 'cloudcart';

    if (selectedSource === 'firestore') {
      return firestoreCategories.getAll();
    } else {
      return cloudCartCategories.getAll();
    }
  } catch (error) {
    console.error('Error fetching categories on server:', error);
    return [];
  }
}
