import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../../firebase/client';
import type { Product } from '@/lib/types/products';

export async function fetchProductsByCategorySlug(slug: string): Promise<Product[]> {
  // Assumes product documents include an `attributes.categories` array
  // with objects including `{ id: string }` for the category id/slug.
  const productsRef = collection(db, 'products');
  const q = query(
    productsRef,
    where('attributes.categories', 'array-contains', { id: slug }),
    limit(100)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Product, 'id'>) }));
}


