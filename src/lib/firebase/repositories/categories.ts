import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase/client';
import type { Category } from '@/lib/categories';

export async function fetchCategoriesFromFirestore(): Promise<Category[]> {
  const categoriesRef = collection(db, 'categories');
  const q = query(categoriesRef, orderBy('attributes.order', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Category, 'id'>) }));
}


