import { getCloudCartClient } from './client';
import { VariantSchema } from '@/schemas/variant';
import type { Variant } from '@/lib/types/products';
import type { VariantStockUpdateResponse } from '@/lib/types/api';

/**
 * Raw CloudCart API response for variants
 */
interface CloudCartVariantsResponse {
  data?: unknown;
  included?: unknown[];
  [key: string]: unknown;
}

/**
 * CloudCart Variants API
 */
export class CloudCartVariantsService {
  constructor(private client = getCloudCartClient()) {}

  /**
   * Get variants for a product
   */
  async getByProductId(productId: string): Promise<Variant[]> {
    const response = await this.client.get<CloudCartVariantsResponse>(
      `/api/v2/products/${productId}?include=variants`,
      this.client.productsRevalidate
    );

    const variants = response.included || [];
    
    // Validate variants
    const validatedVariants = variants
      .map((variant) => {
        const parsed = VariantSchema.safeParse(variant);
        if (!parsed.success) {
          console.warn('Invalid variant data:', parsed.error);
          return null;
        }
        return parsed.data;
      })
      .filter((variant): variant is Variant => variant !== null);

    return validatedVariants;
  }

  /**
   * Update variant stock quantity
   */
  async updateStock(variantId: string, quantity: number): Promise<VariantStockUpdateResponse> {
    return this.client.patch<VariantStockUpdateResponse>(
      `/api/v2/variants/${variantId}`,
      {
        data: {
          type: 'variants',
          id: variantId,
          attributes: { quantity },
        },
      },
      this.client.productsRevalidate
    );
  }
}

let variantsInstance: CloudCartVariantsService | null = null;

function getCloudCartVariantsInstance(): CloudCartVariantsService {
  if (typeof window !== 'undefined') {
    throw new Error('CloudCartVariantsService can only be used on the server');
  }
  if (!variantsInstance) {
    variantsInstance = new CloudCartVariantsService();
  }
  return variantsInstance;
}

// Lazy singleton - only created when accessed
export const cloudCartVariants = new Proxy({} as CloudCartVariantsService, {
  get(_target, prop) {
    const instance = getCloudCartVariantsInstance();
    const value = instance[prop as keyof CloudCartVariantsService];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});

