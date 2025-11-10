import { getServerEnv } from '@/lib/env';
import { REVALIDATE } from '@/lib/cache';
import { HttpError } from '@/lib/http/errors';

/**
 * CloudCart API Client
 * Centralized client for all CloudCart API interactions with standardized error handling,
 * authentication, and revalidation.
 */
export class CloudCartClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    const env = getServerEnv();
    
    if (!env.SITE_URL || !env.CLOUDCART_API_KEY) {
      throw new Error('Missing required CloudCart configuration: SITE_URL and CLOUDCART_API_KEY must be set');
    }

    this.baseUrl = env.SITE_URL;
    this.apiKey = env.CLOUDCART_API_KEY;
  }

  /**
   * Make a request to the CloudCart API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    revalidate?: number
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-CloudCart-ApiKey': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      next: revalidate ? { revalidate } : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new HttpError(
        response.status,
        errorText || `CloudCart API request failed: ${response.statusText}`
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * GET request helper
   */
  async get<T>(endpoint: string, revalidate?: number): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, revalidate);
  }

  /**
   * PATCH request helper
   */
  async patch<T>(endpoint: string, body: unknown, revalidate?: number): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json',
        },
        body: JSON.stringify(body),
      },
      revalidate
    );
  }

  /**
   * Get revalidation time for categories
   */
  get categoriesRevalidate() {
    return REVALIDATE.categories;
  }

  /**
   * Get revalidation time for products
   */
  get productsRevalidate() {
    return REVALIDATE.products;
  }
}

/**
 * Singleton instance of CloudCart client
 * Use this in API routes and server-side code
 */
let clientInstance: CloudCartClient | null = null;

export function getCloudCartClient(): CloudCartClient {
  // Check if we're on the server before creating/returning the client
  if (typeof window !== 'undefined') {
    throw new Error('CloudCartClient can only be used on the server. Use API routes for client-side requests.');
  }
  
  if (!clientInstance) {
    clientInstance = new CloudCartClient();
  }
  return clientInstance;
}

