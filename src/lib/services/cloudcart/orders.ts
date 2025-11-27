import { getCloudCartClient } from './client';
import { CloudCartOrdersResponseSchema, CloudCartOrderSchema, CloudCartOrderItemSchema } from '@/schemas/cloudcart-order';
import type { CloudCartOrder, CloudCartOrderItem, CloudCartOrdersResponse } from '@/schemas/cloudcart-order';
import { z } from 'zod';

export interface GetOrdersOptions {
  page?: number;
  perPage?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * CloudCart Orders API Service
 */
export class CloudCartOrdersService {
  constructor(private client = getCloudCartClient()) {}

  /**
   * Get orders from CloudCart
   */
  async getOrders(options: GetOrdersOptions = {}): Promise<CloudCartOrdersResponse> {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page[number]', options.page.toString());
    if (options.perPage) params.append('page[size]', options.perPage.toString());
    if (options.status) params.append('filter[status]', options.status);
    if (options.dateFrom) params.append('filter[start_date]', options.dateFrom);
    if (options.dateTo) params.append('filter[end_date]', options.dateTo);

    params.append('include', 'products'); // Updated to products
    // Sort by creation date descending
    params.append('sort', '-date_added');

    const endpoint = `/api/v2/orders?${params.toString()}`;
    const response = await this.client.get<unknown>(endpoint);

    const validated = CloudCartOrdersResponseSchema.safeParse(response);
    if (!validated.success) {
      console.error('Invalid CloudCart orders response:', JSON.stringify(validated.error.format(), null, 2));
      throw new Error('Invalid response from CloudCart orders API');
    }

    return validated.data;
  }

  /**
   * Get a specific order by ID
   */
  async getOrder(orderId: string): Promise<CloudCartOrder & { items?: CloudCartOrderItem[] }> {
    // New URL with expanded includes
    const endpoint = `/api/v2/orders/${orderId}?include=products,products.options,discounts,totals,taxes,payment,shipping,shipping-address,billing-address`;
    
    // We define a schema for single order response which includes 'included' array
    const SingleOrderResponseSchema = z.object({
      data: CloudCartOrderSchema,
      included: z.array(z.unknown()).optional(),
    });

    const response = await this.client.get<unknown>(endpoint);
    const validated = SingleOrderResponseSchema.safeParse(response);

    if (!validated.success) {
      console.error(`Invalid CloudCart order response for ${orderId}:`, JSON.stringify(validated.error.format(), null, 2));
      throw new Error(`Invalid response for order ${orderId}`);
    }
    
    const { data, included } = validated.data;
    
    // Find linked products/items
    const items: CloudCartOrderItem[] = [];
    
    // Check which relationship is populated (products or order_items)
    const productLinks = data.relationships?.products?.data || data.relationships?.order_items?.data || [];
    const productIds = new Set(productLinks.map(l => l.id));

    if (included && Array.isArray(included)) {
      for (const item of included) {
        // Match by ID if it's in the relationship list
        // Also check type: usually 'products' or 'order_products' or 'order_items'
        const itemParsed = CloudCartOrderItemSchema.safeParse(item);
        if (itemParsed.success && productIds.has(itemParsed.data.id)) {
           items.push(itemParsed.data);
        }
      }
    }

    return {
      ...data,
      items,
    };
  }
}

// Singleton pattern similar to other services
let ordersInstance: CloudCartOrdersService | null = null;

function getCloudCartOrdersInstance(): CloudCartOrdersService {
  if (typeof window !== 'undefined') {
    throw new Error('CloudCartOrdersService can only be used on the server');
  }
  if (!ordersInstance) {
    ordersInstance = new CloudCartOrdersService();
  }
  return ordersInstance;
}

export const cloudCartOrders = new Proxy({} as CloudCartOrdersService, {
  get(_target, prop) {
    const instance = getCloudCartOrdersInstance();
    const value = instance[prop as keyof CloudCartOrdersService];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});
