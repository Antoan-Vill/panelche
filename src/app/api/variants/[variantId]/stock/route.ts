import { z } from 'zod';
import { cloudCartVariants } from '@/lib/services/cloudcart';
import { badRequest, serverError, ok } from '@/lib/http/response';
import { VariantStockUpdateSchema } from '@/schemas/variant';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ variantId: string }> }
) {
  try {
    const { variantId } = await params;
    const ParamsSchema = z.object({ variantId: z.string().min(1) });
    const parsedParams = ParamsSchema.safeParse({ variantId });
    if (!parsedParams.success) {
      return badRequest('Invalid parameters', parsedParams.error.flatten());
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Invalid JSON body received for variant stock update:', parseError);
      return badRequest('Invalid JSON body');
    }

    const parsedBody = VariantStockUpdateSchema.safeParse(body);
    if (!parsedBody.success) {
      return badRequest('Invalid body', parsedBody.error.flatten());
    }

    const result = await cloudCartVariants.updateStock(variantId, parsedBody.data.quantity);
    return ok(result);
  } catch (error) {
    console.error('Error updating variant stock:', error);
    return serverError('Internal server error');
  }
}
