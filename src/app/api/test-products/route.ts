import { ok } from '@/lib/http/response';
import { cloudCartProducts, getCloudCartClient } from '@/lib/services/cloudcart';
import { ProductsResponseSchema2 } from '@/schemas/product';

export async function GET() {
  try {
    // Test the raw API call first
    const client = getCloudCartClient();
    const params = new URLSearchParams({
      'filter[category_id]': '7',
      'include': 'images',
      'page[size]': '100',
      'page[number]': '1',
      'sort': 'sort_order',
      'direction': 'asc',
    });

    const rawResponse = await client.get(`/api/v2/products?${params.toString()}`, 300);

    // Test schema validation
    const parsed = ProductsResponseSchema2.safeParse(rawResponse);

    // Type guard for object access
    const isObject = (value: unknown): value is Record<string, unknown> => {
      return typeof value === 'object' && value !== null;
    };

    return ok({
      rawResponseKeys: isObject(rawResponse) ? Object.keys(rawResponse) : [],
      hasData: isObject(rawResponse) && 'data' in rawResponse,
      hasMeta: isObject(rawResponse) && 'meta' in rawResponse,
      dataLength: isObject(rawResponse) && rawResponse.data && Array.isArray(rawResponse.data) ? rawResponse.data.length : 0,
      firstProductKeys: isObject(rawResponse) && rawResponse.data && Array.isArray(rawResponse.data) && rawResponse.data[0] && isObject(rawResponse.data[0]) ? Object.keys(rawResponse.data[0]) : null,
      schemaValidationSuccess: parsed.success,
      schemaErrors: parsed.success ? null : parsed.error.issues.slice(0, 3),
      rawResponseSample: JSON.stringify(rawResponse).slice(0, 1000)
    });
  } catch (error) {
    console.error('Raw API test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return ok({
      success: false,
      error: errorMessage,
      stack: errorStack
    });
  }
}
