import 'server-only';
import { adminDb } from '@/lib/firebase/admin';
import type { Category } from '@/lib/types/categories';

export interface GetCategoriesOptions {
  limit?: number;
  offset?: number;
  include?: string;
}

/**
 * Firestore Categories Service
 * Mirrors the CloudCart categories service interface for seamless switching
 */
export class FirestoreCategoriesService {
  private readonly collectionName = 'categories';

  /**
   * Get all categories
   */
  async getAll(options: GetCategoriesOptions = {}): Promise<Category[]> {
    const { limit = 50, offset = 0 } = options;

    const snapshot = await adminDb
      .collection(this.collectionName)
      .orderBy('attributes.order', 'asc')
      .offset(offset)
      .limit(limit)
      .get();

    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      type: 'categories',
      attributes: doc.data().attributes || {},
    })) as Category[];

    return categories;
  }

  /**
   * Get category by slug (url_handle)
   */
  async getBySlug(slug: string): Promise<Category | null> {
    const snapshot = await adminDb
      .collection(this.collectionName)
      .where('attributes.url_handle', '==', slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      type: 'categories',
      attributes: doc.data().attributes || {},
    } as Category;
  }

  /**
   * Get category by ID
   */
  async getById(categoryId: string): Promise<Category | null> {
    const doc = await adminDb
      .collection(this.collectionName)
      .doc(categoryId)
      .get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      type: 'categories',
      attributes: doc.data()?.attributes || {},
    } as Category;
  }
}

// Singleton pattern matching CloudCart service
let categoriesInstance: FirestoreCategoriesService | null = null;

function getFirestoreCategoriesInstance(): FirestoreCategoriesService {
  if (typeof window !== 'undefined') {
    throw new Error('FirestoreCategoriesService can only be used on the server');
  }
  if (!categoriesInstance) {
    categoriesInstance = new FirestoreCategoriesService();
  }
  return categoriesInstance;
}

// Lazy singleton - only created when accessed
export const firestoreCategories = new Proxy({} as FirestoreCategoriesService, {
  get(_target, prop) {
    const instance = getFirestoreCategoriesInstance();
    const value = instance[prop as keyof FirestoreCategoriesService];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});
