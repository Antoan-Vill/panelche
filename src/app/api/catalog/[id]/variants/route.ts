export const revalidate = 300;

import { z } from 'zod';
import { serverError, badRequest, ok } from '@/lib/http/response';
import { cloudCartVariants } from '@/lib/services/cloudcart';
import { VariantSchema } from '@/schemas/variant';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ParamsSchema = z.object({ id: z.string().min(1) });
    const parsedParams = ParamsSchema.safeParse({ id });
    if (!parsedParams.success) {
      return badRequest('Invalid parameters', parsedParams.error.flatten());
    }

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

