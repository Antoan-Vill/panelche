import { getCloudCartClient } from './client';
import { ProductsResponseSchema2 } from '@/schemas/product';
import type { ProductsResponse, Product } from '@/lib/types/products';

export interface GetProductsOptions {
  page?: number;
  perPage?: number;
  categoryId?: string;
  include?: string;
  query?: string;
}

/**
 * CloudCart Products API
 */
export class CloudCartProductsService {
  constructor(private client = getCloudCartClient()) {}

  /**
   * Get products by category slug
   */
  async getByCategory(slug: string, page: number = 1): Promise<ProductsResponse> {
    // First get the category to find its ID
    const { cloudCartCategories } = await import('./categories');
    const category = await cloudCartCategories.getBySlug(slug);

    if (!category) {
      throw new Error(`Category with slug "${slug}" not found`);
    }

    const products = await this.getByCategoryId(category.id, page);
    return products;
  }

  /**
   * Get products by category ID
   */
  async getByCategoryId(categoryId: string, page: number = 1): Promise<ProductsResponse> {
    const params = new URLSearchParams({
      'filter[category_id]': categoryId,
      'include': 'images',
      'page[size]': '100',
      'page[number]': page.toString(),
      'sort': 'sort_order',
      'direction': 'asc',
    });

    const response = await this.client.get<unknown>(
      `/api/v2/products?${params.toString()}`,
      this.client.productsRevalidate
    );

    const parsed = ProductsResponseSchema2.safeParse(response);
    if (!parsed.success) {
      throw new Error('Invalid products response format');
    }

    return parsed.data as ProductsResponse;
  }

  /**
   * Get all products with optional filters
   */
  async getAll(options: GetProductsOptions = {}): Promise<ProductsResponse> {
    const {
      page = 1,
      perPage = 20,
      categoryId,
      include = 'images',
      query,
    } = options;

    const params = new URLSearchParams({
      'page[size]': perPage.toString(),
      'page[number]': page.toString(),
    });

    if (include) {
      params.append('include', include);
    }

    if (categoryId) {
      params.append('filter[category_id]', categoryId);
    }

    if (query) {
      params.append('filter[name][icontains]', query);
    }

    const response = await this.client.get<unknown>(
      `/api/v2/products?${params.toString()}`,
      this.client.productsRevalidate
    );

    const parsed = ProductsResponseSchema2.safeParse(response);
    if (!parsed.success) {
      throw new Error('Invalid products response format');
    }

    return parsed.data as ProductsResponse;
  }

  /**
   * Get product by ID
   */
  async getById(productId: string, include: string = 'images'): Promise<Product> {
    const response = await this.client.get<{ data: Product }>(
      `/api/v2/products/${productId}?include=${include}`,
      this.client.productsRevalidate
    );

    return response.data;
  }
}

let productsInstance: CloudCartProductsService | null = null;

function getCloudCartProductsInstance(): CloudCartProductsService {
  if (typeof window !== 'undefined') {
    throw new Error('CloudCartProductsService can only be used on the server');
  }
  if (!productsInstance) {
    productsInstance = new CloudCartProductsService();
  }
  return productsInstance;
}

// Lazy singleton - only created when accessed
export const cloudCartProducts = new Proxy({} as CloudCartProductsService, {
  get(_target, prop) {
    const instance = getCloudCartProductsInstance();
    const value = instance[prop as keyof CloudCartProductsService];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});

