import 'server-only';
import { adminDb } from '@/lib/firebase/admin';
import type { ProductsResponse, Product, PaginationMeta } from '@/lib/types/products';

export interface GetProductsOptions {
  page?: number;
  perPage?: number;
  categoryId?: string;
  query?: string;
}

/**
 * Check if a value is a Firestore Timestamp (either SDK instance or serialized)
 */
function isFirestoreTimestamp(value: unknown): value is { _seconds: number; _nanoseconds: number } | { toDate: () => Date } {
  if (typeof value !== 'object' || value === null) return false;
  
  // Check for serialized timestamp (has _seconds and _nanoseconds)
  if ('_seconds' in value && '_nanoseconds' in value) return true;
  
  // Check for SDK Timestamp instance (has toDate method)
  if ('toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') return true;
  
  return false;
}

/**
 * Convert Firestore document data to plain objects
 * Handles Timestamp conversion and removes non-serializable fields
 */
function serializeFirestoreDoc(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      result[key] = value;
    } else if (isFirestoreTimestamp(value)) {
      // Convert Firestore Timestamp to ISO string
      if ('toDate' in value && typeof value.toDate === 'function') {
        result[key] = value.toDate().toISOString();
      } else if ('_seconds' in value) {
        result[key] = new Date((value as { _seconds: number })._seconds * 1000).toISOString();
      }
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => 
        typeof item === 'object' && item !== null 
          ? serializeFirestoreDoc(item as Record<string, unknown>)
          : item
      );
    } else if (typeof value === 'object') {
      result[key] = serializeFirestoreDoc(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Firestore Products Service
 * Mirrors the CloudCart products service interface for seamless switching
 */
export class FirestoreProductsService {
  private readonly collectionName = 'products';

  /**
   * Get products by category slug
   */
  async getByCategory(slug: string, page: number = 1): Promise<ProductsResponse> {
    // Query products where categories array contains an object with matching slug
    const perPage = 100;
    const offset = (page - 1) * perPage;

    // Firestore array-contains requires exact object match
    // Our categories are stored as [{ id: "slug", name: "Name" }]
    // We need to query by the full object or just use the id field
    
    // Get all products and filter by category (simpler, works without index)
    const snapshot = await adminDb
      .collection(this.collectionName)
      .get();

    // Filter products that have the category
    const allProducts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...serializeFirestoreDoc(doc.data() as Record<string, unknown>),
    })) as Product[];

    const filteredProducts = allProducts.filter(p => 
      p.attributes?.categories?.some((cat: { id: string }) => cat.id === slug)
    );

    const total = filteredProducts.length;
    
    // Paginate
    const paginatedProducts = filteredProducts.slice(offset, offset + perPage);

    return this.buildResponse(paginatedProducts, page, perPage, total);
  }

  /**
   * Get products by category ID (same as getByCategory, kept for API compatibility)
   */
  async getByCategoryId(categoryId: string, page: number = 1): Promise<ProductsResponse> {
    return this.getByCategory(categoryId, page);
  }

  /**
   * Get all products with optional filters
   */
  async getAll(options: GetProductsOptions = {}): Promise<ProductsResponse> {
    const {
      page = 1,
      perPage = 20,
      categoryId,
      query,
    } = options;

    const offset = (page - 1) * perPage;
    let baseQuery = adminDb.collection(this.collectionName);

    // Build query based on filters
    // Note: Firestore has limitations on compound queries, so we handle them carefully
    let firestoreQuery: FirebaseFirestore.Query = baseQuery;

    if (categoryId) {
      firestoreQuery = firestoreQuery.where('attributes.categories', 'array-contains', { id: categoryId });
    }

    // Get total count
    const countSnapshot = await firestoreQuery.count().get();
    const total = countSnapshot.data().count;

    // Get paginated products
    let paginatedQuery = firestoreQuery
      .offset(offset)
      .limit(perPage);

    const snapshot = await paginatedQuery.get();

    let products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...serializeFirestoreDoc(doc.data() as Record<string, unknown>),
    })) as Product[];

    // If there's a search query, filter client-side
    // (Firestore doesn't support full-text search natively)
    if (query) {
      const lowerQuery = query.toLowerCase();
      products = products.filter(p => 
        p.attributes?.name?.toLowerCase().includes(lowerQuery)
      );
    }

    return this.buildResponse(products, page, perPage, total);
  }

  /**
   * Get product by ID
   */
  async getById(productId: string): Promise<Product> {
    const doc = await adminDb
      .collection(this.collectionName)
      .doc(productId)
      .get();

    if (!doc.exists) {
      throw new Error(`Product with ID "${productId}" not found`);
    }

    return {
      id: doc.id,
      ...serializeFirestoreDoc(doc.data() as Record<string, unknown>),
    } as Product;
  }

  /**
   * Build a standardized ProductsResponse
   */
  private buildResponse(
    products: Product[],
    page: number,
    perPage: number,
    total: number
  ): ProductsResponse {
    const lastPage = Math.ceil(total / perPage) || 1;
    const from = total > 0 ? (page - 1) * perPage + 1 : 0;
    const to = Math.min(page * perPage, total);

    const meta: PaginationMeta = {
      page: {
        'current-page': page,
        'per-page': perPage,
        from,
        to,
        total,
        'last-page': lastPage,
      },
    };

    return {
      data: products,
      meta,
    };
  }
}

// Singleton pattern matching CloudCart service
let productsInstance: FirestoreProductsService | null = null;

function getFirestoreProductsInstance(): FirestoreProductsService {
  if (typeof window !== 'undefined') {
    throw new Error('FirestoreProductsService can only be used on the server');
  }
  if (!productsInstance) {
    productsInstance = new FirestoreProductsService();
  }
  return productsInstance;
}

// Lazy singleton - only created when accessed
export const firestoreProducts = new Proxy({} as FirestoreProductsService, {
  get(_target, prop) {
    const instance = getFirestoreProductsInstance();
    const value = instance[prop as keyof FirestoreProductsService];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});
