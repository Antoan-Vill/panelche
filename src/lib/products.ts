import type { Variant } from '@/lib/types/products';

// Only export client-safe functions here
// Server-only functions should be imported directly in server components
export async function getProductVariantsClient(
  productId: string,
  source: 'cloudcart' | 'firestore' = 'cloudcart'
): Promise<Variant[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const url = baseUrl
      ? `${baseUrl}/api/catalog/${productId}/variants?source=${source}`
      : `/api/catalog/${productId}/variants?source=${source}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return [];
    }
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.error('Error fetching variants via API route:', err);
    return [];
  }
}

