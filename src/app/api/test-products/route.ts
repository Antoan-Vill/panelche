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

    return ok({
      rawResponseKeys: Object.keys(rawResponse),
      hasData: 'data' in rawResponse,
      hasMeta: 'meta' in rawResponse,
      dataLength: rawResponse.data ? rawResponse.data.length : 0,
      firstProductKeys: rawResponse.data && rawResponse.data[0] ? Object.keys(rawResponse.data[0]) : null,
      schemaValidationSuccess: parsed.success,
      schemaErrors: parsed.success ? null : parsed.error.issues.slice(0, 3),
      rawResponseSample: JSON.stringify(rawResponse).slice(0, 1000)
    });
  } catch (error) {
    console.error('Raw API test error:', error);
    return ok({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
