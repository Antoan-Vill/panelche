export const revalidate = 300;

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { serverError, badRequest, ok } from '@/lib/http/response';
import { cloudCartVariants } from '@/lib/services/cloudcart';
import { VariantSchema } from '@/schemas/variant';
import type { ApiRouteResponse } from '@/lib/types/api';
import type { Variant } from '@/lib/types/products';

// Hardcoded sizes for Firestore products
const FIRESTORE_SIZES = [34, 36, 38, 40, 42, 44, 46];

/**
 * Generate hardcoded variants for Firestore products
 */
function generateFirestoreVariants(productId: string): Variant[] {
  return FIRESTORE_SIZES.map((size, index) => ({
    id: `${productId}-size-${size}`,
    type: 'variants',
    attributes: {
      item_id: parseInt(productId, 10) || index,
      v1: String(size),
      v2: null,
      v3: null,
      v1_id: size,
      v2_id: null,
      v3_id: null,
      quantity: 10, // Default stock
      sku: `${productId}-${size}`,
      barcode: '',
      price: 0, // Price comes from product
      delivery_price: null,
      weight: null,
      unit_id: null,
      unit_value: null,
      unit_text: null,
      minimum: 1,
      base_unit_value: 1,
      base_unit_id: null,
      unit_type: 'piece',
      unit_name: null,
      unit_short_name: null,
      unit_value_formatted: null,
    },
  }));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): ApiRouteResponse<Variant[]> {
  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const source = searchParams.get('source') || 'cloudcart';

    const ParamsSchema = z.object({ id: z.string().min(1) });
    const parsedParams = ParamsSchema.safeParse({ id });
    if (!parsedParams.success) {
      return badRequest('Invalid parameters', parsedParams.error.flatten());
    }

    // For Firestore, return hardcoded size variants
    if (source === 'firestore') {
      const variants = generateFirestoreVariants(id);
      return ok(variants);
    }

    // For CloudCart, fetch from API
    const variants = await cloudCartVariants.getByProductId(id);
    
    // Validate variants
    const isValid = Array.isArray(variants) && variants.every((v) => VariantSchema.safeParse(v).success);
    if (!isValid) {
      // Attach the raw payload as error details for debugging in the UI
      return serverError('Invalid variants payload', variants);
    }

    return ok(variants);
  } catch (error) {
    const err = error as { status?: number; message?: string };
    const status = typeof err?.status === 'number' ? err.status : 500;
    const message =
      status === 429
        ? 'Rate limited while fetching product variants. Please try again shortly.'
        : 'Failed to fetch product variants.';

    return serverError(message, { status });
  }
}

